const StaffLeave = require("../../models/StaffLeave");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");

/**
 * Personel İzin & Mazeret Yönetim Servisi
 */
class StaffLeaveService {
  /**
   * Kullanıcının aktif izinli olup olmadığını sorgular
   */
  static async isUserOnLeave(userId, guildId) {
    const leaves = await StaffLeave.find({ userId, guildId, status: "APPROVED" });
    if (!leaves || leaves.length === 0) return false;
    const now = new Date();
    return leaves.some(l => {
      const end = new Date(l.endDate);
      return end >= now;
    });
  }

  /**
   * İzin başvuru Modal formunu oluşturur
   */
  static createLeaveRequestModal() {
    const modal = new ModalBuilder()
      .setCustomId("modal_staff_leave_request")
      .setTitle("📋 Personel İzin & Mazeret Talebi");

    const reasonInput = new TextInputBuilder()
      .setCustomId("leave_reason")
      .setLabel("İzin Sebebi / Mazeretiniz")
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder("İzin alma gerekçenizi detaylıca açıklayınız...")
      .setRequired(true);

    const daysInput = new TextInputBuilder()
      .setCustomId("leave_days")
      .setLabel("İzin Süresi (Gün)")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("Örn: 3")
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(reasonInput),
      new ActionRowBuilder().addComponents(daysInput)
    );

    return modal;
  }

  /**
   * İzin talebini kaydeder ve yetkili onay paneline gönderir
   */
  static async submitLeaveRequest(interaction) {
    const reason = interaction.fields.getTextInputValue("leave_reason");
    const daysStr = interaction.fields.getTextInputValue("leave_days");
    const durationDays = parseInt(daysStr, 10) || 1;

    const startDate = new Date();
    const endDate = new Date(Date.now() + durationDays * 86400000);

    const newLeave = await StaffLeave.create({
      userId: interaction.user.id,
      guildId: interaction.guild.id,
      reason: reason,
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
      durationDays: durationDays,
      status: "PENDING"
    });

    const embed = new EmbedBuilder()
      .setTitle("📝 İzin Talebiniz Alındı")
      .setDescription(`İzin talebiniz yönetim onayına gönderildi.`)
      .addFields(
        { name: "👤 Personel", value: `<@${interaction.user.id}>`, inline: true },
        { name: "📅 Süre", value: `${durationDays} Gün (${startDate.toLocaleDateString("tr-TR")} - ${endDate.toLocaleDateString("tr-TR")})`, inline: true },
        { name: "📄 Mazeret", value: reason }
      )
      .setColor(0xF1C40F)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });

    // Üst Yönetim Bildirimi (Varsa yetkili log/onay kanalı)
    const logChannelId = process.env.STAFF_LEAVE_LOG_CHANNEL_ID;
    if (logChannelId && interaction.guild.channels.cache.has(logChannelId)) {
      const channel = interaction.guild.channels.cache.get(logChannelId);
      
      const adminEmbed = new EmbedBuilder()
        .setTitle("⚠️ Yeni Personel İzin Talebi")
        .setDescription(`**${interaction.user.tag}** bir mazeret izni talep etti.`)
        .addFields(
          { name: "Personel", value: `<@${interaction.user.id}>`, inline: true },
          { name: "Süre", value: `${durationDays} Gün`, inline: true },
          { name: "Gerekçe", value: reason }
        )
        .setColor(0x3498DB);

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`btn_leave_approve_${newLeave._id}`)
          .setLabel("✅ Onayla")
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`btn_leave_reject_${newLeave._id}`)
          .setLabel("❌ Reddet")
          .setStyle(ButtonStyle.Danger)
      );

      await channel.send({ embeds: [adminEmbed], components: [row] });
    }
  }

  /**
   * İzin onaylama/reddetme buton etkileşimi
   */
  static async handleApprovalButton(interaction, leaveId, isApproved) {
    const leave = await StaffLeave.findOne({ _id: leaveId });
    if (!leave) {
      return interaction.reply({ content: "❌ İzin talebi bulunamadı.", ephemeral: true });
    }

    leave.status = isApproved ? "APPROVED" : "REJECTED";
    leave.approvedBy = interaction.user.id;
    leave.approvedAt = new Date();
    await leave.save();

    const statusText = isApproved ? "✅ ONAYLANDI" : "❌ REDDEDİLDİ";
    const embed = new EmbedBuilder()
      .setTitle(`İzin Talebi ${statusText}`)
      .addFields(
        { name: "Personel", value: `<@${leave.userId}>`, inline: true },
        { name: "İşlem Yapan Yönetici", value: `<@${interaction.user.id}>`, inline: true },
        { name: "Süre", value: `${leave.durationDays} Gün`, inline: true }
      )
      .setColor(isApproved ? 0x2ECC71 : 0xE74C3C)
      .setTimestamp();

    await interaction.update({ embeds: [embed], components: [] });

    // Kullanıcıya DM Bildirimi
    try {
      const user = await interaction.client.users.fetch(leave.userId);
      if (user) {
        await user.send(`📢 İzin talebiniz **${interaction.user.tag}** tarafından **${statusText}** olarak güncellendi.`);
      }
    } catch (e) {}
  }
}

module.exports = StaffLeaveService;
