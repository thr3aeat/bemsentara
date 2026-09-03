'use strict';

const assert = require('assert');
const {
  TARGET_REPORT_CHANNEL_ID,
  TRACKED_GUILDS,
  recordMessage,
  recordMemberJoin,
  recordMemberLeave,
  analyzeGuildTrajectory,
  buildMainDashboardEmbed,
  buildGuildDetailEmbed,
  buildComparisonEmbed,
  buildTrajectoryEmbed,
  buildAnalyticsActionRow,
  handleAnalyticsButtonInteraction,
  sendDailyReport,
  loadAnalyticsData,
  saveAnalyticsData,
  getTodayKey
} = require('../bot/services/serverDailyAnalyticsService');

async function runTests() {
  console.log('🧪 [Test] serverDailyAnalyticsService testleri başlatılıyor...');

  // 1. Hedef kanal ve sunucular doğrulaması
  assert.strictEqual(TARGET_REPORT_CHANNEL_ID, '1544400099004784700', 'Hedef rapor kanalı doğru olmalı');
  assert.strictEqual(TRACKED_GUILDS.ROBLOXLND.id, '1537407325290237973', 'RobloxLand ID doğru olmalı');
  assert.strictEqual(TRACKED_GUILDS.EKOYILDIZ.id, '1367646464804655104', 'EkoYıldız ID doğru olmalı');
  console.log('✅ 1. Hedef kanal ve sunucu ID sabitleri doğrulandı.');

  // 2. Etkinlik kayıt fonksiyonları (Join, Leave, Message)
  const rblxId = TRACKED_GUILDS.ROBLOXLND.id;
  const ekoId = TRACKED_GUILDS.EKOYILDIZ.id;

  recordMemberJoin(rblxId, 'test_user_1');
  recordMemberJoin(rblxId, 'test_user_2');
  recordMemberLeave(rblxId, 'test_user_3');

  recordMessage(rblxId, 'test_chan_1', 'test_user_1');
  recordMessage(rblxId, 'test_chan_1', 'test_user_1');
  recordMessage(rblxId, 'test_chan_2', 'test_user_2');

  recordMemberJoin(ekoId, 'test_user_eko_1');
  recordMessage(ekoId, 'test_eko_chan', 'test_user_eko_1');

  const data = loadAnalyticsData();
  const today = getTodayKey();
  const rblxRecord = data.days[today][rblxId];

  assert(rblxRecord.joins >= 2, 'RobloxLand giriş sayısı kaydedilmeli');
  assert(rblxRecord.leaves >= 1, 'RobloxLand çıkış sayısı kaydedilmeli');
  assert(rblxRecord.messages >= 3, 'RobloxLand mesaj sayısı kaydedilmeli');
  assert.strictEqual(rblxRecord.userMessages['test_user_1'], 2, 'Kullanıcı mesajı doğru sayılmalı');
  assert.strictEqual(rblxRecord.channelMessages['test_chan_1'], 2, 'Kanal mesajı doğru sayılmalı');
  console.log('✅ 2. Giriş, çıkış ve mesaj izleme fonksiyonları doğrulandı.');

  // 3. Analiz & Yörünge Hesaplama Motoru (analyzeGuildTrajectory)
  const mockGuild = { id: rblxId, memberCount: 150 };
  const mockDay = {
    joins: 10,
    leaves: 2,
    messages: 120,
    userMessages: { u1: 50, u2: 40, u3: 30 },
    channelMessages: { c1: 120 },
    hourlyMessages: Array(24).fill(5)
  };

  const analysis = analyzeGuildTrajectory(mockGuild, mockDay);
  assert.strictEqual(analysis.netGrowth, 8, 'Net büyüme = Joins - Leaves (10 - 2 = 8)');
  assert(analysis.healthScore > 50, 'Pozitif büyüme ve aktif mesajlaşma sağlık skorunu yükseltmeli');
  assert(analysis.projected30DayMembers > 150, '30 günlük projeksiyon artış göstermeli');
  assert(analysis.recommendations.length > 0, 'Stratejik tavsiyeler üretilmeli');
  console.log('✅ 3. Sağlık skoru ve sunucu gelecek rotası hesaplama motoru doğrulandı.');

  // 4. Discord Embed & Buton Oluşturucuları
  const mockClient = {
    guilds: {
      cache: {
        get: (id) => ({ id, name: id === rblxId ? 'RobloxLand' : 'EkoYıldız', memberCount: 150 })
      }
    },
    user: {
      displayAvatarURL: () => 'https://cdn.discordapp.com/embed/avatars/0.png'
    },
    channels: {
      cache: {
        get: (id) => null
      },
      fetch: async (id) => {
        if (id === TARGET_REPORT_CHANNEL_ID) {
          return {
            id,
            send: async (payload) => {
              assert(payload.embeds?.length > 0, 'Embed içermeli');
              assert(payload.components?.length > 0, 'Buton içermeli');
              return { id: 'mock_msg_id' };
            }
          };
        }
        return null;
      }
    }
  };

  const mainEmbed = buildMainDashboardEmbed(mockClient, today);
  assert(mainEmbed.data.title.includes('GÜNLÜK SUNUCU ANALİZİ'), 'Ana dashboard başlığı doğru olmalı');
  assert(mainEmbed.data.fields.length >= 3, 'RobloxLand, EkoYıldız ve Nereye Gidiyor alanları bulunmalı');

  const rblxDetailEmbed = buildGuildDetailEmbed(mockClient, 'ROBLOXLND', today);
  assert(rblxDetailEmbed.data.title.includes('RobloxLand'), 'RobloxLand detay başlığı olmalı');

  const compEmbed = buildComparisonEmbed(mockClient, today);
  assert(compEmbed.data.title.includes('KARŞILAŞTIRMASI'), 'Karşılaştırma başlığı olmalı');

  const trajEmbed = buildTrajectoryEmbed(mockClient, today);
  assert(trajEmbed.data.title.includes('NEREYE GİDİYOR'), 'Yörünge analizi başlığı olmalı');

  const row = buildAnalyticsActionRow();
  assert.strictEqual(row.components.length, 5, '5 adet interaktif buton bulunmalı');
  console.log('✅ 4. Embedler ve Buton Satırı başarıyla oluşturuldu.');

  // 5. Buton Etkileşim Yöneticisi (handleAnalyticsButtonInteraction)
  let repliedPayload = null;
  const mockInteraction = {
    customId: 'btn_analytics_robloxland',
    client: mockClient,
    replied: false,
    deferred: false,
    reply: async (payload) => {
      repliedPayload = payload;
      return true;
    },
    deferUpdate: async () => {},
    editReply: async (payload) => {
      repliedPayload = payload;
      return true;
    }
  };

  const handled = await handleAnalyticsButtonInteraction(mockInteraction);
  assert.strictEqual(handled, true, 'Robloxland butonu işlenmeli');
  assert(repliedPayload?.embeds?.length > 0, 'Butona yanıt olarak detay embedi gönderilmeli');

  // 6. Rapor Gönderim Fonksiyonu (sendDailyReport)
  const sent = await sendDailyReport(mockClient, today);
  assert.strictEqual(sent, true, 'sendDailyReport başarıyla kanala göndermeli');
  console.log('✅ 5. Buton etkileşimleri ve günlük rapor gönderimi başarıyla doğrulandı.');

  console.log('\n🎉 Tüm testler başarıyla geçti!');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('❌ Test başarısız:', err);
  process.exit(1);
});
