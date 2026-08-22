const cron = require("node-cron");
const { EmbedBuilder } = require("discord.js");
const { chatWithAI } = require("./aiService");
const { getSpecialDayInfo } = require("./specialDaysHelper");

const TARGET_CHANNEL_ID = process.env.EKO_YILDIZ_HISTORY_CHANNEL_ID || "1518692463177498674";

/**
 * Her gün sabah 09:00'da tarih ve özel gün paylaşımı yapar.
 * @param {import('discord.js').Client} client
 */
function startEkoYildizHistoryScheduler(client) {
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
 * @param {import('discord.js').Client} client
 * @param {Date} [customDate] - İsteğe bağlı özel tarih (test için)
 */
async function postEkoYildizHistory(client, customDate = null) {
  try {
    const channel = await client.channels.fetch(TARGET_CHANNEL_ID).catch(() => null);
    if (!channel || !channel.isTextBased()) {
      console.warn("⚠️ [EkoYildizHistoryAI] Hedef kanal bulunamadı veya metin kanalı değil:", TARGET_CHANNEL_ID);
      return;
    }

    const today = customDate instanceof Date ? customDate : new Date();
    const day = today.getDate();
    const month = today.getMonth();
    const months = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
    const dateStr = `${day} ${months[month]}`;

    // 1. Özel Gün / Bayram Kontrolü
    const specialDay = getSpecialDayInfo(today);
    const isFirstDayOfMonth = (day === 1 && !specialDay);

    let embedTitle = `📅 Tarihte Bugün - ${dateStr}`;
    let embedColor = 0xf39c12; // Varsayılan EkoYıldız Turuncu/Altın
    let specialField = null;

    const systemPrompt = `Sen Türk ve dünya tarihi konusunda derin uzmanlığa sahip saygın bir tarih akademisyenisin.
Görevin: İstenen tarihte gerçekleşmiş önemli tarihi gelişmeyi (özellikle Türk tarihi ve Atatürk odaklı) doğru, akıcı ve saygılı bir Türkçe ile aktarmak.

KESİN ÇIKTI KURALLARI:
1. Yanıtın SADECE ve DOĞRUDAN yayınlanacak Türkçe metinden oluşmalıdır.
2. Kesinlikle hiçbir İngilizce kelime, iç düşünce (thinking/reasoning process), taslak, kural kontrolü veya planlama adımı YAZMA.
3. Giriş/selamlama yapma, başlık atma, kural veya prompt tekrarı YAZMA.
4. Doğrudan tarihi olayın anlatımına başla.`;

    let userPrompt = "";

    if (specialDay) {
      embedTitle = `${specialDay.emoji} ${specialDay.name} - ${dateStr}`;
      embedColor = specialDay.color || 0xf39c12;

      specialField = {
        name: `📌 ${specialDay.emoji} Günün Anlam ve Önemi`,
        value: `${specialDay.desc}\n> *"${specialDay.quote}"*`
      };

      if (specialDay.isMourning) {
        userPrompt = `Bugün ${specialDay.name} (${dateStr}). Ulu Önder Gazi Mustafa Kemal Atatürk'ün ebediyete intikalinin yıl dönümünde onun fikirlerini, inkılaplarını ve aziz hatırasını 1-2 paragraf halinde derin ve saygılı bir üslupla anlat. Sadece Türkçe yaz.`;
      } else {
        userPrompt = `Bugün ${specialDay.name} (${dateStr}). Bu özel günün anlam ve önemini, Türk tarihindeki yerini ve ${dateStr} tarihinde yaşanmış tarihi gelişmeleri 1-2 akıcı paragraf halinde anlat. Sadece Türkçe yaz.`;
      }
    } else if (isFirstDayOfMonth) {
      embedTitle = `🌟 YENİ AYA MERHABA! - 1 ${months[month]}`;
      embedColor = 0x8e44ad; // Mor tonu
      userPrompt = `Tarih: 1 ${months[month]} (Ayın ilk günü). Lütfen aşağıdaki şablona tam olarak uyacak şekilde bir metin oluştur:

🌟 YENİ AYA MERHABA!
Bu ay Tarihte Bugün EkoYıldız'da [bu ay içinde yaşanmış, Türk ve dünya tarihinden 3-4 adet dikkat çeken önemli tarihi konu başlığı/tema] konularını göreceksiniz.

📅 Bugünün Tarihte Bugünü:
[Tarihte bugün yaşanan önemli bir tarihi olay hakkında 1-2 paragraflık sürükleyici anlatım]

Kurallar:
- Şablondaki başlıkları (🌟 YENİ AYA MERHABA!, 📅 Bugünün Tarihte Bugünü:) aynen kullan.
- Metin doğrudan bu şablonla başlasın. Sadece Türkçe yaz.`;
    } else {
      userPrompt = `Tarih: ${dateStr}.
Mustafa Kemal Atatürk'ün hayatında ve Türk tarihinde ${dateStr} tarihinde (veya bu günlerde) gerçekleşmiş önemli bir tarihi olayı 1-2 paragraf halinde anlat. Yıl bilgisini metin içinde doğal biçimde ver. Sadece Türkçe metin üret.`;
    }

    let aiContent = "";
    try {
      aiContent = await chatWithAI([{ role: 'user', content: userPrompt }], systemPrompt, 'ticket', { max_tokens: 1200, temperature: 0.6 });
    } catch (aiErr) {
      console.error("❌ [EkoYildizHistoryAI] AI isteği başarısız:", aiErr.message);
      if (specialDay) {
        aiContent = `Bugün ${specialDay.name}! ${specialDay.desc}\n\n${dateStr} gününde yaşanan tüm tarihi gelişmeleri ve milletimizin kahramanlıklarını saygıyla anıyoruz.`;
      } else if (isFirstDayOfMonth) {
        aiContent = `🌟 YENİ AYA MERHABA!\nBu ay Tarihte Bugün EkoYıldız'da dünya ve Türk tarihinin en önemli dönüm noktalarını göreceksiniz.\n\n📅 Bugünün Tarihte Bugünü:\n${dateStr} tarihinde yaşanan tüm gelişmeleri ve tarihi olayları saygıyla hatırlıyoruz.`;
      } else {
        aiContent = `${dateStr} gününde yaşanan tarihi gelişmeleri ve önemli olayları saygıyla hatırlıyoruz.`;
      }
    }

    const embed = new EmbedBuilder()
      .setTitle(embedTitle)
      .setDescription(aiContent)
      .setColor(embedColor)
      .setFooter({ text: "EkoYıldız Yapay Zeka Tarih Sistemi", iconURL: client.user.displayAvatarURL() })
      .setTimestamp();

    if (specialField) {
      embed.addFields(specialField);
    }

    await channel.send({ embeds: [embed] });
    console.log(`✅ [EkoYildizHistoryAI] ${embedTitle} mesajı başarıyla gönderildi.`);
    return true;
  } catch (error) {
    console.error("❌ [EkoYildizHistoryAI] Mesaj gönderim hatası:", error);
    return false;
  }
}

module.exports = {
  startEkoYildizHistoryScheduler,
  postEkoYildizHistory
};
