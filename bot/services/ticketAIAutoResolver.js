'use strict';

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Ticket = require('../../models/Ticket');
const { chatWithAI } = require('./aiService');

// Dahili SSS (Sıkça Sorulan Sorular & Çözümler) Veritabanı
const FAQ_DATABASE = [
  {
    keywords: ['roblox', 'yetki', 'dogrula', 'doğrula', 'hesap', 'bagla', 'bağla', 'rowifi', 'grup', 'rütbe'],
    title: '🔐 Roblox Hesap Doğrulama & Rütbe Senkronizasyonu',
    solution: 'Roblox hesabınızı doğrulamak ve grup rütbenizi Discord yetkilerinize aktarmak için `/dogrula` veya `/authorize` komutunu çalıştırmanız yeterlidir.\n\nEğer grup rütbeniz güncellenmediyse `/update` komutunu deneyebilirsiniz.'
  },
  {
    keywords: ['maaş', 'maas', 'coin', 'bakiye', 'para', 'odul', 'ödül', 'günlük', 'gunluk'],
    title: '🪙 Maaş ve Coin Kazanma Rehberi',
    solution: 'Haftalık maaşınızı toplamak için sohbet üzerindeki **"Maaşımı Al"** butonuna basabilir veya `/gunluk-odul` komutunu kullanabilirsiniz.\n\nAyrıca sesli kanallarda vakit geçirerek ve destek biletleri çözerek ekstra coin kazanabilirsiniz.'
  },
  {
    keywords: ['ceza', 'mute', 'ban', 'itiraz', 'kodos', 'hapishane', 'uyarı', 'uyari'],
    title: '⚖️ Ceza İtirazı ve Sicil Sorgulama',
    solution: 'Cezanıza itiraz etmek için Mahkeme kanalından `/istinaf-basvuru` yapabilir veya adli sicilinizi görmek için `/sabika-kaydi` komutunu kullanabilirsiniz.'
  },
  {
    keywords: ['birim', 'alım', 'alim', 'katıl', 'katil', 'sınav', 'sinav', 'başvuru'],
    title: '🛡️ Birim Katılımı ve Sınav Süreci',
    solution: 'Birime (Ban, Ses veya Sohbet) katılmak için `/birim-alimi` komutunu kullanarak AI destekli sınavı başlatabilirsiniz. Minimum 8/10 başarı ile rütbe elde edersiniz.'
  },
  {
    keywords: ['reklam', 'fiyat', 'tanıtım', 'tanitim', 'sponsor', 'ödeme'],
    title: '📢 Reklam & Sponsorluk Paketleri',
    solution: 'Sunucumuzda reklam vermek için paket fiyatlarımız:\n• Shorts Reklamı: **30₺**\n• Video Altı Link: **50₺**\n• Özel Sponsorluk / Banner: **100₺**\n\nYetkililerimiz ödeme detayları için sizinle hemen ilgilenecektir.'
  }
];

/**
 * Kullanıcı mesajından ve geçmiş arşiv kapatılmış biletlerden en uygun çözümü bulur.
 */
async function findBestResolution(userMessage, category) {
  try {
    if (!userMessage || userMessage.trim().length < 4) return null;

    const lowerMsg = userMessage.toLowerCase();

    // 1. SSS Veritabanında Kelime/Puan Eşleştirmesi
    let bestFaqMatch = null;
    let maxMatchCount = 0;

    for (const faq of FAQ_DATABASE) {
      let matches = 0;
      for (const kw of faq.keywords) {
        if (lowerMsg.includes(kw)) matches++;
      }
      if (matches > maxMatchCount && matches >= 1) {
        maxMatchCount = matches;
        bestFaqMatch = faq;
      }
    }

    if (bestFaqMatch) {
      return {
        matched: true,
        confidence: 0.85,
        title: bestFaqMatch.title,
        solution: bestFaqMatch.solution,
        source: 'SSS Veritabanı'
      };
    }

    // 2. MongoDB Arşivlenmiş ve Çözülmüş Biletlerde Arama
    const closedTickets = await Ticket.find({
      status: 'closed',
      closeReason: { $exists: true, $ne: '' }
    }).limit(20).sort({ updatedAt: -1 });

    for (const t of closedTickets) {
      if (t.subject && lowerMsg.includes(t.subject.toLowerCase())) {
        return {
          matched: true,
          confidence: 0.80,
          title: `📁 Arşiv Çözümü: ${t.subject}`,
          solution: t.closeReason || 'Bu bilet daha önce benzer konuda çözüme kavuşturulmuştur.',
          source: 'Bilet Arşivi'
        };
      }
    }

    // 3. AI ile Akıllı Analiz (Fallback)
    const prompt = `Aşağıdaki kullanıcı sorununa göre sıkça sorulan sorulara dayalı kısa bir çözüm üret.
Kullanıcı Mesajı: "${userMessage}"
Eğer bilinen net bir yanıt varsa çözüm metnini ver, aksi halde "YETERSİZ" cevabını ver.`;

    const aiRes = await chatWithAI(prompt, 'Sen destek biletlerini otomasyonla çözen akıllı asistanısın. Türkçe, max 200 karakter.').catch(() => null);

    if (aiRes && !aiRes.toUpperCase().includes('YETERSİZ')) {
      return {
        matched: true,
        confidence: 0.75,
        title: '🤖 Yapay Zeka Tarafından Üretilen Çözüm Önerisi',
        solution: aiRes,
        source: 'AI Smart Auto-Resolver'
      };
    }

    return null;
  } catch (err) {
    console.error('[ticketAIAutoResolver] findBestResolution hatası:', err.message);
    return null;
  }
}

/**
 * Bilete gelen ilk mesaja otomatik çözüm önerisi embed'i gönderir
 */
async function processTicketMessageForAutoResolution(ticket, message, client) {
  try {
    if (!message || !message.content || message.author.bot) return;

    const resolution = await findBestResolution(message.content, ticket.category);
    if (!resolution || !resolution.matched) return;

    const channel = await client.channels.fetch(ticket.channelId).catch(() => null);
    if (!channel || !channel.isTextBased()) return;

    const embed = new EmbedBuilder()
      .setColor(0x3498DB)
      .setTitle(`🤖 AI Akıllı Bilet Asistanı: Otomatik Çözüm Önerisi`)
      .setDescription(
        `Merhaba <@${ticket.userId}>!\n\n` +
        `Yazdığınız mesaja göre arşiv veritabanımızdan olası bir çözüm önerisi tespit ettik:\n\n` +
        `### ${resolution.title}\n` +
        `> ${resolution.solution.replace(/\n/g, '\n> ')}\n\n` +
        `*Kaynak: ${resolution.source}*\n\n` +
        `**Aradığınız cevap bu mu? Aşağıdaki butonlardan birini seçin:**`
      )
      .setFooter({ text: 'EkoYıldız AI Auto-Resolver V2.0' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`btn_ticket_smart_resolve_${ticket.ticketId}`)
        .setLabel('✅ Sorunumu Çözdü (Bileti Kapat)')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`btn_ticket_smart_need_staff_${ticket.ticketId}`)
        .setLabel('👨‍💻 Yetkiliye Aktar')
        .setStyle(ButtonStyle.Secondary)
    );

    await channel.send({ embeds: [embed], components: [row] });
  } catch (err) {
    console.error('[ticketAIAutoResolver] processTicketMessageForAutoResolution hatası:', err.message);
  }
}

/**
 * Akıllı çözüm butonlarına tıklamaları işler
 */
async function handleSmartResolveButton(interaction) {
  const { customId, client } = interaction;
  await interaction.deferReply({ ephemeral: true }).catch(() => {});
  try {
    const ticketId = customId.replace('btn_ticket_smart_resolve_', '').replace('btn_ticket_smart_need_staff_', '');
    const ticket = await Ticket.findOne({ ticketId });

    if (!ticket) {
      return interaction.editReply({ content: '❌ Bilet kaydı bulunamadı.' });
    }

    if (customId.startsWith('btn_ticket_smart_resolve_')) {
      ticket.status = 'closed';
      ticket.closedAt = new Date();
      ticket.closedBy = interaction.user.id;
      ticket.closeReason = 'AI Akıllı Auto-Resolver tarafından çözüldü ve kapatıldı.';
      ticket.solvedByAI = true;
      await ticket.save();

      // Kanalı güncelle ve kapat
      const channel = await client.channels.fetch(ticket.channelId).catch(() => null);
      if (channel) {
        const closedEmbed = new EmbedBuilder()
          .setColor(0x2ECC71)
          .setTitle('🎉 Bilet Başarıyla AI Tarafından Çözüldü ve Kapatıldı!')
          .setDescription(
            `Kullanıcı <@${interaction.user.id}> sunduğumuz otomatik çözümü onayladı.\n` +
            `Yetkili müdahalesine gerek kalmadan bilet istatistiklere işlendi ve arşivlendi.`
          )
          .setTimestamp();

        await channel.send({ embeds: [closedEmbed] });
        setTimeout(async () => {
          await channel.delete().catch(() => {});
        }, 5000);
      }

      return interaction.editReply({ content: '✅ Biletiniz otomatik olarak çözüldü olarak işaretlendi ve kapatıldı. İletişiminiz için teşekkür ederiz!' });
    }

    if (customId.startsWith('btn_ticket_smart_need_staff_')) {
      return interaction.editReply({ content: '👍 Talebiniz yetkililerimize iletildi. En kısa sürede yetkili ekibimiz biletinize dönüş yapacaktır!' });
    }
  } catch (err) {
    console.error('[ticketAIAutoResolver] handleSmartResolveButton hatası:', err.message);
    return interaction.editReply({ content: `❌ İşlem sırasında hata oluştu: ${err.message}` });
  }
}

module.exports = {
  FAQ_DATABASE,
  findBestResolution,
  processTicketMessageForAutoResolution,
  handleSmartResolveButton
};
