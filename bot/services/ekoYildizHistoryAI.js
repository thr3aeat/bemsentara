const cron = require("node-cron");
const { EmbedBuilder } = require("discord.js");
const { chatWithAI } = require("./aiService");

const TARGET_CHANNEL_ID = process.env.EKO_YILDIZ_HISTORY_CHANNEL_ID || "1518692463177498674";

/**
 * Her gün sabah 09:00'da tarih paylaşımı yapar.
 * @param {import('discord.js').Client} client
 */
function startEkoYildizHistoryScheduler(client) {
  // Her gün sabah saat 09:00'da çalışır
  cron.schedule("0 9 * * *", async () => {
    try {
      console.log("🕒 [EkoYildizHistoryAI] Günlük görev başlatılıyor...");
      await postEkoYildizHistory(client);
    } catch (err) {
      console.error("❌ [EkoYildizHistoryAI] Cron hatası:", err);
    }
  });
}

/**
 * AI'dan bilgi alıp kanala gönderir.
 * Manuel test etmek için dışarıya da açıldı.
 * @param {import('discord.js').Client} client
 */
async function postEkoYildizHistory(client) {
  try {
    const channel = await client.channels.fetch(TARGET_CHANNEL_ID).catch(() => null);
    if (!channel || !channel.isTextBased()) {
      console.warn("⚠️ [EkoYildizHistoryAI] Hedef kanal bulunamadı veya metin kanalı değil:", TARGET_CHANNEL_ID);
      return;
    }

    const today = new Date();
    const day = today.getDate();
    const month = today.getMonth();
    const months = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
    const dateStr = `${day} ${months[month]}`;

    const systemPrompt = `Sen Türk ve dünya tarihi konusunda derin uzmanlığa sahip saygın bir tarih akademisyenisin.
Görevin: İstenen tarihte gerçekleşmiş önemli tarihi gelişmeyi (özellikle Türk tarihi ve Atatürk odaklı) doğru, akıcı ve saygılı bir Türkçe ile aktarmak.

KESİN ÇIKTI KURALLARI:
1. Yanıtın SADECE ve DOĞRUDAN yayınlanacak Türkçe metinden oluşmalıdır.
2. Kesinlikle hiçbir İngilizce kelime, iç düşünce (thinking/reasoning process), taslak, kural kontrolü veya planlama adımı YAZMA.
3. Giriş/selamlama yapma, başlık atma, kural veya prompt tekrarı YAZMA.
4. Doğrudan tarihi olayın anlatımına başla.`;

    let userPrompt = `Tarih: ${dateStr}.
Mustafa Kemal Atatürk'ün hayatında ve Türk tarihinde ${dateStr} tarihinde (veya bu günlerde) gerçekleşmiş önemli bir olayı 1-2 paragraf halinde anlat. Yıl bilgisini metin içinde doğal biçimde ver. Sadece Türkçe metin üret.`;
    const isFirstDayOfMonth = (day === 1);

    if (isFirstDayOfMonth) {
      userPrompt = `Tarih: ${dateStr} (Ayın ilk günü). Lütfen aşağıdaki şablona tam olarak uyacak şekilde bir metin oluştur:

🌟 YENİ AYA MERHABA!
Bu ay Tarihte Bugün EkoYıldız'da [bu ay içinde yaşanmış, Türk ve dünya tarihinden 3-4 adet dikkat çeken önemli tarihi konu başlığı/tema] konularını göreceksiniz.

📅 Bugünün Tarihte Bugünü:
[Tarihte bugün yaşanan önemli bir tarihi olay hakkında 1-2 paragraflık sürökleyici anlatım]

Kurallar:
- Şablondaki başlıkları (🌟 YENİ AYA MERHABA!, 📅 Bugünün Tarihte Bugünü:) aynen kullan.
- Metin doğrudan bu şablonla başlasın.`;
    }

    let aiContent = "";
    try {
      aiContent = await chatWithAI([{ role: 'user', content: userPrompt }], systemPrompt, 'ticket', { max_tokens: 1200, temperature: 0.6 });
    } catch (aiErr) {
      console.error("❌ [EkoYildizHistoryAI] AI isteği başarısız:", aiErr.message);
      if (isFirstDayOfMonth) {
        aiContent = `🌟 YENİ AYA MERHABA!\nBu ay Tarihte Bugün EkoYıldız'da dünya ve Türk tarihinin en önemli dönüm noktalarını göreceksiniz.\n\n📅 Bugünün Tarihte Bugünü:\n${dateStr} tarihinde yaşanan tüm gelişmeleri ve tarihi olayları saygıyla hatırlıyoruz.`;
      } else {
        aiContent = `${dateStr} gününde yaşanan tarihi gelişmeleri ve önemli olayları saygıyla hatırlıyoruz.`;
      }
    }

    const embed = new EmbedBuilder()
      .setTitle(`📅 Tarihte Bugün - ${dateStr}`)
      .setDescription(aiContent)
      .setColor(0xf39c12) // Turuncu / EkoYıldız temasına uygun
      .setFooter({ text: "EkoYıldız Yapay Zeka Tarih Sistemi", iconURL: client.user.displayAvatarURL() })
      .setTimestamp();

    await channel.send({ embeds: [embed] });
    console.log(`✅ [EkoYildizHistoryAI] ${dateStr} mesajı başarıyla gönderildi.`);
  } catch (error) {
    console.error("❌ [EkoYildizHistoryAI] Mesaj gönderim hatası:", error);
  }
}

module.exports = {
  startEkoYildizHistoryScheduler,
  postEkoYildizHistory
};
