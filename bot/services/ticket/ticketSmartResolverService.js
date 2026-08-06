const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

/**
 * AI Ticket Ön-Yanıtlayıcı (FAQ & Smart Resolver) Servisi
 */
class TicketSmartResolverService {
  /**
   * SSS (Sıkça Sorulan Sorular) Veri Tabanı
   */
  static getFAQDatabase() {
    return [
      {
        keywords: ["roblox", "doğrulama", "dogrula", "rowifi", "kod"],
        question: "Roblox Hesabımı Nasıl Doğrularım?",
        answer: "Hesabınızı doğrulamak için **Yönetim Paneli** veya **Hesap Doğrulama** menüsündeki `🔐 Roblox Doğrula` butonuna tıklayıp oyun içi doğrulama kodunuzu giriniz."
      },
      {
        keywords: ["yetkili", "başvuru", "basvuru", "mod", "stajyer"],
        question: "Nasıl Yetkili / Moderatör Olabilirim?",
        answer: "Yetkili başvurusu yapmak için destek panellerimizdeki `📝 Moderatör Okulu` veya `Yetkili Başvuru` butonlarını kullanabilirsiniz. Şartlar: 15 yaş üzeri ve temiz ceza geçmişi."
      },
      {
        keywords: ["ban", "af", "itinazsız", "cezalı", "jail"],
        question: "Cezama Nasıl İtiraz Edebilirim?",
        answer: "Cezanıza veya ceza puanınıza itiraz etmek için ana menüdeki `⚖️ Ceza İtiraz` paneline giderek form doldurabilirsiniz. Talebiniz Denetim Kurulu tarafından incelenir."
      },
      {
        keywords: ["ekonom", "bakiye", "ekocoin", "mülk", "borsa"],
        question: "EkoCoin ve Borsa Nasıl Çalışır?",
        answer: "Aktiflik gösterdikçe EkoCoin kazanırsınız. Kazandığınız coinler ile Sanal Şehir'de emlak satın alabilir veya $EKO Index borsasında yatırım yapabilirsiniz."
      }
    ];
  }

  /**
   * Ticket metnini analiz edip eşleşen SSS önerisi sunar
   */
  static async processTicketCreation(channel, user, ticketSubject = "") {
    const db = this.getFAQDatabase();
    const lowerText = ticketSubject.toLowerCase();

    const matched = db.find(item => item.keywords.some(kw => lowerText.includes(kw)));

    if (!matched) return false; // Eşleşme yoksa doğrudan normal yetkili bekleme akışı devam eder.

    const embed = new EmbedBuilder()
      .setTitle("🤖 AI Akıllı Asistan Önerisi")
      .setDescription(`Merhaba <@${user.id}>! Sorunuzla ilgili olabilecek **otomatik çözüm önerisi** bulundu:`)
      .addFields(
        { name: `❓ ${matched.question}`, value: matched.answer }
      )
      .setFooter({ text: "Bu çözüm sorununuzu yanıtladı mı? Aşağıdaki butonları kullanabilirsiniz." })
      .setColor(0x3498DB)
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("btn_ticket_resolved_by_ai")
        .setLabel("✅ Sorunum Çözüldü (Ticket'ı Kapat)")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("btn_ticket_need_staff")
        .setLabel("💬 Yetkili Beklemek İstiyorum")
        .setStyle(ButtonStyle.Primary)
    );

    await channel.send({ embeds: [embed], components: [row] });
    return true;
  }

  /**
   * Buton Etkileşimi Yönetimi
   */
  static async handleButton(interaction) {
    if (interaction.customId === "btn_ticket_resolved_by_ai") {
      const embed = new EmbedBuilder()
        .setTitle("🎉 Ticket Başarıyla Çözüldü")
        .setDescription("Sorununuzun çözülmesine sevindik! Ticket kanalı kapatılıyor...")
        .setColor(0x2ECC71);

      await interaction.update({ embeds: [embed], components: [] });
      setTimeout(() => {
        interaction.channel.delete().catch(() => {});
      }, 5000);
    } else if (interaction.customId === "btn_ticket_need_staff") {
      const embed = new EmbedBuilder()
        .setTitle("⏳ Yetkili Talebi Alındı")
        .setDescription("Talebiniz yetkili ekibimize iletildi. En kısa sürede yanıt verilecektir.")
        .setColor(0xF1C40F);

      await interaction.update({ embeds: [embed], components: [] });
    }
  }
}

module.exports = TicketSmartResolverService;
