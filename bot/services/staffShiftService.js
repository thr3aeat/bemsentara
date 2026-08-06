const StaffShift = require("../../models/StaffShift");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

/**
 * Personel Canlı Vardiya Takip Servisi
 */
class StaffShiftService {
  /**
   * Kullanıcının devam eden aktif vardiyasını getirir
   */
  static async getActiveShift(userId, guildId) {
    return await StaffShift.findOne({ userId, guildId, status: "ACTIVE" });
  }

  /**
   * Vardiyayı Başlatır
   */
  static async startShift(interaction, shiftType = "GENERAL") {
    const active = await this.getActiveShift(interaction.user.id, interaction.guild.id);
    if (active) {
      return interaction.reply({
        content: "⚠️ Zaten aktif bir vardiyanız bulunmaktadır! Önce mevcut vardiyanızı sonlandırınız.",
        ephemeral: true
      });
    }

    const newShift = await StaffShift.create({
      userId: interaction.user.id,
      guildId: interaction.guild.id,
      shiftType: shiftType,
      startedAt: new Date(),
      status: "ACTIVE"
    });

    const embed = new EmbedBuilder()
      .setTitle("🟢 Vardiya Başlatıldı")
      .setDescription(`Başarıyla **${shiftType}** vardiyasına giriş yaptınız. Kolay gelsin!`)
      .addFields(
        { name: "👤 Personel", value: `<@${interaction.user.id}>`, inline: true },
        { name: "⏰ Başlangıç Zamanı", value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
      )
      .setColor(0x2ECC71)
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("btn_staff_shift_stop")
        .setLabel("🛑 Vardiyayı Bitir")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId("btn_staff_shift_status")
        .setLabel("📊 Canlı Durum")
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  }

  /**
   * Vardiyayı Bitiş Kaydı ile Sonlandırır
   */
  static async stopShift(interaction) {
    const shift = await this.getActiveShift(interaction.user.id, interaction.guild.id);
    if (!shift) {
      return interaction.reply({
        content: "❌ Aktif bir vardiyanız bulunmamaktadır.",
        ephemeral: true
      });
    }

    const now = new Date();
    const durationMs = now - new Date(shift.startedAt);
    const durationMinutes = Math.floor(durationMs / 60000);

    shift.endedAt = now;
    shift.durationMinutes = durationMinutes;
    shift.status = "COMPLETED";
    await shift.save();

    const embed = new EmbedBuilder()
      .setTitle("🔴 Vardiya Tamamlandı")
      .setDescription(`Vardiyanız başarıyla kaydedildi. Emekleriniz için teşekkürler!`)
      .addFields(
        { name: "👤 Personel", value: `<@${interaction.user.id}>`, inline: true },
        { name: "⏱️ Toplam Süre", value: `${durationMinutes} Dakika`, inline: true },
        { name: "📋 Tür", value: shift.shiftType, inline: true }
      )
      .setColor(0xE74C3C)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }

  /**
   * Canlı Vardiya Durumu
   */
  static async getShiftStatus(interaction) {
    const shift = await this.getActiveShift(interaction.user.id, interaction.guild.id);
    if (!shift) {
      return interaction.reply({ content: "ℹ️ Şu anda aktif bir vardiyanız bulunmuyor.", ephemeral: true });
    }

    const durationMinutes = Math.floor((Date.now() - new Date(shift.startedAt)) / 60000);

    const embed = new EmbedBuilder()
      .setTitle("📊 Canlı Vardiya Durumu")
      .addFields(
        { name: "Personel", value: `<@${shift.userId}>`, inline: true },
        { name: "Vardiya Türü", value: shift.shiftType, inline: true },
        { name: "Geçen Süre", value: `${durationMinutes} Dakika`, inline: true }
      )
      .setColor(0x3498DB);

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
}

module.exports = StaffShiftService;
