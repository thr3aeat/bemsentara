'use strict';

require('dotenv').config();
const { MongoClient } = require('mongodb');
const { EmbedBuilder } = require('discord.js');
const { createDiscordClient } = require('../bot/client');
const { GUILD2_ID, GUILD2_TICKET_CATEGORY_ID, TOKEN } = require('../config');

const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

async function runCleanup() {
  if (!TOKEN) {
    console.error('TOKEN bulunamadı!');
    process.exit(1);
  }

  const mongoClient = new MongoClient(uri);
  await mongoClient.connect();
  const db = mongoClient.db();
  console.log('✅ MongoDB bağlantısı sağlandı.');

  const client = createDiscordClient();

  client.once('ready', async () => {
    console.log(`🤖 Bot giriş yaptı: ${client.user.tag}`);

    try {
      const guild = await client.guilds.fetch(GUILD2_ID);
      if (!guild) {
        console.error('Guild bulunamadı!');
        process.exit(1);
      }

      console.log(`🏰 Sunucu: ${guild.name} (${guild.id})`);

      // 1. Kategori içindeki kanalları çek
      const category = await guild.channels.fetch(GUILD2_TICKET_CATEGORY_ID);
      if (!category) {
        console.error('TALEPLER kategorisi bulunamadı!');
        process.exit(1);
      }

      const channelsToDelete = [];
      category.children.cache.forEach(ch => {
        if (ch.type === 0 && ch.name.toLowerCase() !== 'ticket-logs') {
          channelsToDelete.push(ch);
        }
      });

      console.log(`🗑️ '📩 → TALEPLER' kategorisinde silinecek ${channelsToDelete.length} adet ticket kanalı bulundu:`);
      channelsToDelete.forEach(c => console.log(`   - #${c.name} (${c.id})`));

      // 2. Bu kanalları açan kullanıcıları MongoDB'den ve overwrites'dan tespit et
      const userSpamMap = new Map(); // userId -> { userTag, channels: [] }

      for (const ch of channelsToDelete) {
        let openerUserId = null;
        let openerUserName = null;

        // DB'den ara (data.channelId veya data.ticketId)
        const dbRecord = await db.collection('storerecords').findOne({
          collection: 'tickets',
          $or: [
            { 'data.channelId': ch.id },
            { 'data.ticketId': ch.name.replace('ticket-', '').toUpperCase() }
          ]
        });

        if (dbRecord && dbRecord.data?.userId) {
          openerUserId = dbRecord.data.userId;
          openerUserName = dbRecord.data.userName || 'Bilinmeyen';
        }

        // Eğer DB'de yoksa permissionOverwrites'a bak
        if (!openerUserId) {
          for (const [tId, po] of ch.permissionOverwrites.cache) {
            if (po.type === 1 && tId !== client.user.id) {
              openerUserId = tId;
              break;
            }
          }
        }

        // Eğer reklam kanalıysa: reklam-username
        if (!openerUserId && ch.name.startsWith('reklam-')) {
          const rawName = ch.name.replace('reklam-', '');
          const userRec = await db.collection('storerecords').findOne({
            collection: 'users',
            'data.username': new RegExp(`^${rawName}$`, 'i')
          });
          if (userRec && userRec.data?.discordId) {
            openerUserId = userRec.data.discordId;
            openerUserName = userRec.data.username;
          }
        }

        if (openerUserId) {
          if (!userSpamMap.has(openerUserId)) {
            userSpamMap.set(openerUserId, {
              userTag: openerUserName || openerUserId,
              channels: []
            });
          }
          userSpamMap.get(openerUserId).channels.push(ch);
        }
      }

      console.log('\n👥 Tespit edilen kullanıcılar:');
      for (const [uId, data] of userSpamMap.entries()) {
        console.log(`   - <@${uId}> (${data.userTag}): ${data.channels.length} kanal`);
      }

      // 3. DM Gönderme işlemi
      console.log('\n📩 Kullanıcılara DM bildirimleri gönderiliyor...');
      const dmMessage = 
        `⚠️ **Destek Talepleri Bildirimi**\n\n` +
        `Merhaba,\n` +
        `**Eko Yıldız** sunucumuzda hesabınız üzerinden bir sürü ticket açıldığı tespit edilmiş olup açılan mükerrer ticket kanalları kapatılmıştır.\n\n` +
        `Yetkililerle görüşmek için lütfen sunucudan **bir tane ticket** oluşturarak ticketinizde yetkililerle konuşabilirsiniz.\n\n` +
        `İyi günler dileriz.`;

      const dmEmbed = new EmbedBuilder()
        .setTitle("🎫 Destek Talepleri Bildirimi")
        .setColor(0xFFA500)
        .setDescription(
          `**Eko Yıldız** sunucumuzda hesabınız üzerinden bir sürü ticket açıldığı tespit edilmiş olup açılan mükerrer ticket kanalları kapatılmıştır.\n\n` +
          `Yetkililerle görüşmek için lütfen sunucudan **bir tane ticket** oluşturarak ticketinizde yetkililerle konuşabilirsiniz.`
        )
        .setFooter({ text: "Eko Yıldız Destek & Moderasyon Sistemi" })
        .setTimestamp();

      for (const [uId, data] of userSpamMap.entries()) {
        try {
          const user = await client.users.fetch(uId).catch(() => null);
          if (user) {
            await user.send({
              content: dmMessage,
              embeds: [dmEmbed]
            }).catch(e => console.warn(`   ⚠️ DM iletilemedi (${data.userTag}): ${e.message}`));
            console.log(`   ✅ DM başarıyla iletildi: ${data.userTag} (${uId})`);
          }
        } catch (dmErr) {
          console.warn(`   ⚠️ DM hatası (${uId}):`, dmErr.message);
        }
      }

      // 4. Kanalları Discord'dan sil
      console.log('\n🧹 Kanallar Discord üzerinden siliniyor...');
      let deletedCount = 0;
      for (const ch of channelsToDelete) {
        try {
          await ch.delete('Ticket Temizliği: Mükerrer / spam ticket kanalları temizlendi');
          deletedCount++;
          console.log(`   ✅ Silindi: #${ch.name} (${ch.id})`);
          // Rate-limit önlemek için kısa bekleme
          await new Promise(r => setTimeout(r, 400));
        } catch (delErr) {
          console.error(`   ❌ Kanal silinemedi (#${ch.name}):`, delErr.message);
        }
      }

      // 5. MongoDB'deki ilgili açık ticket'ları kapat
      console.log('\n🗄️ MongoDB üzerinde ilgili ticket durumları "closed" olarak güncelleniyor...');
      const channelIds = channelsToDelete.map(c => c.id);
      const updateRes = await db.collection('storerecords').updateMany(
        {
          collection: 'tickets',
          'data.channelId': { $in: channelIds }
        },
        {
          $set: {
            'data.status': 'closed',
            'data.closedAt': new Date(),
            'data.closeReason': 'Mükerrer ticket temizliği yapıldı'
          }
        }
      );
      console.log(`   ✅ MongoDB üzerinde ${updateRes.modifiedCount} ticket kaydı kapatıldı.`);

      console.log(`\n🎉 TEMİZLİK TAMAMLANDI! Toplam ${deletedCount} kanal başarıyla silindi.`);

    } catch (err) {
      console.error('Temizlik hatası:', err);
    } finally {
      await mongoClient.close();
      client.destroy();
      process.exit(0);
    }
  });

  await client.login(TOKEN);
}

runCleanup().catch(err => {
  console.error('Fatal cleanup error:', err);
  process.exit(1);
});
