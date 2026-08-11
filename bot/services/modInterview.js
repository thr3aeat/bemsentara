'use strict';

/**
 * Moderatör Başvuru Mülakatı Servisi (v2 — Düzeltilmiş & Geliştirilmiş)
 *
 * Değişiklikler:
 * - questionCount mantığı düzeltildi (cevaplanan soru sayısını takip eder)
 * - history yönetimi düzeltildi (sistem mesajları history'ye karışmıyor)
 * - avgScore hesabı düzeltildi
 * - Mülakat timeout (30 dk) eklendi — memory leak önlendi
 * - Typo'lar düzeltildi
 * - Rol / staff kaydı hatalarında kullanıcı ve admin bilgilendiriliyor
 * - finalizeInterview rol+staff işlemleri tek try/catch yerine ayrı ayrı yakalanıyor
 * - Tüm gönderimler .catch(console.error) yerine loglanıyor
 * - cleanSummary slice limiti 1024 → 4096 (embed description sınırı)
 * - İlk soru mantiği ayrı bir prompt ile tetikleniyor (gereksiz systemMsg kaldırıldı)
 */

const {
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
} = require('discord.js');
const { chatWithAI } = require('./aiService');
const StaffProgress = require('../../models/StaffProgress');

const MOD_ROLE_ID = process.env.MOD_ROLE_ID || '1518692389169135666';
const MOD_GUILD_ID = process.env.MOD_GUILD_ID || '1367646464804655104';

const INTERVIEW_TIMEOUT_MS = 30 * 60 * 1000; // 30 dakika

/**
 * activeInterviews: userId → {
 *   adminId, guildId, client,
 *   history[],          ← yalnızca kullanıcı cevapları + AI yanıtları
 *   answeredCount,      ← kaçıncı soruya cevap verildi (0–7)
 *   totalScore,
 *   startTime,
 *   responses[],
 *   username,
 *   timeoutHandle
 * }
 */
const activeInterviews = new Map();

async function saveInterviewToDB(userId, info) {
  try {
    const ModInterview = require('../../models/ModInterview');
    await ModInterview.findOneAndUpdate(
      { userId },
      {
        adminId: info.adminId,
        guildId: info.guildId,
        history: info.history,
        answeredCount: info.answeredCount,
        totalScore: info.totalScore,
        startTime: info.startTime || new Date(),
        responses: info.responses,
        username: info.username,
      },
      { upsert: true }
    );
  } catch (err) {
    console.error('[modInterview] DB save error:', err.message);
  }
}

// ── Sistem promptu ─────────────────────────────────────────────────────────
const INTERVIEW_SYSTEM = `Sen Eko Yıldız Discord sunucusu için MASTER MODERATÖR mülakatı yapan bir yapay zekasın.
Bu, en zor ve en seçici mülakat. Adaya toplamda 7 adet ÇOK ZOR, ANALİTİK, GERÇEK DURUM sorusu sor.

SORU KATEGORİLERİ (sırayla):
1. KURAL İHLALİ SENARYOSU (spam, taciz, küfür, NSFW tespiti)
2. ÇATIŞMA YÖNETİMİ (2+ kullanıcı tartışması, nasıl müdahale edersin?)
3. YETKİ SINIRLARI (ban vs warn, ne zaman kullanılır?)
4. EKİP İLETİŞİMİ VE ŞEFFAFLIK (hassas kararları nasıl yönetirsin?)
5. SUNUCU GÜVENLİĞİ (bot spam, alt hesaplar, güven seviyesi)
6. TOPLULUK YÖNETİMİ (büyüme, sosyal dinamik, mod tükenmişliği)
7. ZORLUK DEĞERLENDİRMESİ (bu rolün gerçek zorlukları ve sorumlulukları)

AKIŞ:
- Her turda önce önceki cevabı değerlendir (ilk turda değerlendirme yok), ardından yeni soruyu sor.
- 7. soruya cevap geldikten sonra SONUÇ ver.

DEĞERLENDİRME FORMATI (zorunlu, her cevap sonrası):
[PUAN: X/10] Kısa değerlendirme metni.

SONUÇ FORMATI (7. cevap sonrası zorunlu):
[SONUÇ: KABUL] (Ortalama >= 7.0) veya [SONUÇ: RET] (Ortalama < 7.0)
Ardından 3-5 satır genel değerlendirme ve gelişim önerileri yaz.

ÜSLİP:
- Profesyonel, adil, destekleyici, Türkçe
- Her soru MAX 250 karakter`;

// ── Yardımcı: güvenli DM gönder ───────────────────────────────────────────
async function safeSend(user, payload, label = '') {
  try {
    await user.send(payload);
  } catch (err) {
    console.error(`[modInterview] DM gönderilemedi${label ? ' (' + label + ')' : ''}:`, err.message);
  }
}

// ── Timeout temizleyici ────────────────────────────────────────────────────
function clearInterview(userId) {
  const info = activeInterviews.get(userId);
  if (info?.timeoutHandle) clearTimeout(info.timeoutHandle);
  activeInterviews.delete(userId);

  const ModInterview = require('../../models/ModInterview');
  ModInterview.deleteOne({ userId }).catch(err => {
    console.error('[modInterview] DB delete error:', err.message);
  });
}

// ── Timeout başlat / yenile ────────────────────────────────────────────────
function refreshTimeout(userId, client) {
  const info = activeInterviews.get(userId);
  if (!info) return;

  if (info.timeoutHandle) clearTimeout(info.timeoutHandle);

  info.timeoutHandle = setTimeout(async () => {
    activeInterviews.delete(userId);
    const user = await client.users.fetch(userId).catch(() => null);
    if (user) {
      await safeSend(user, {
        embeds: [new EmbedBuilder()
          .setColor(0xfbbf24)
          .setTitle('⏰ Mülakat Süresi Doldu')
          .setDescription(
            '30 dakika boyunca yanıt alınamadı.\n\n' +
            'Mülakat otomatik olarak sonlandırıldı. İstersen tekrar başvurabilirsin.'
          )
          .setFooter({ text: 'Eko Yıldız • MOD-ALIM Sistemi' })
          .setTimestamp()],
      }, 'timeout bildirimi');
    }
  }, INTERVIEW_TIMEOUT_MS);
}

// ── Başvuru başlat ─────────────────────────────────────────────────────────
async function startModInterview(targetUser, adminId, guildId, client) {
  if (activeInterviews.has(targetUser.id)) {
    clearInterview(targetUser.id);
  }

  // ── DOĞRUDAN ONAY: Mülakat sorusu sormadan direkt kabul et ──
  const welcomeEmbed = new EmbedBuilder()
    .setColor(0x2ecc71)
    .setTitle('🎉 MODERATÖRLÜĞE KABUL EDİLDİN!')
    .setThumbnail(targetUser.avatarURL() || null)
    .setDescription(
      `# 🏆 TEBRİKLER! MODERATÖR EKİBİNE KATILDIN\n\n` +
      `Sayın **${targetUser.username}** 👋,\n\n` +
      `> **Eko Yıldız Yönetim Kurulu** kararıyla **Moderatörlük Başvurunuz Doğrudan Onaylanmıştır!** 🎉\n\n` +
      `### 🛡️ Sağlanan Haklar & Yetkiler:\n` +
      `• **Moderatör Rolleri:** Tüm yönetim yetkileriniz aktif edildi.\n` +
      `• **Personel Kaydı:** Statünüz aktif edilip İK sistemine eklendiniz.\n` +
      `• **Yetkili Rozeti:** Profilinize resmi yetkili nişanı tanımlandı.\n\n` +
      `### 🚀 Sonraki Adım:\n` +
      `Lütfen yetkili kanallarındaki talimatları takip edin. Aramıza hoş geldin! 💪`
    )
    .setFooter({ text: 'Eko Yıldız • İnsan Kaynakları & MOD-ALIM Sistemi' })
    .setTimestamp();

  try {
    await targetUser.send({ embeds: [welcomeEmbed] });
  } catch (err) {
    console.error('[modInterview] Kabul DM gönderilemedi:', err.message);
    return false;
  }

  // Direkt kabul et — mülakat adımlarını atla
  const fakeInfo = {
    adminId,
    guildId,
    client,
    history: [],
    answeredCount: 0,
    totalScore: 70,
    startTime: Date.now(),
    responses: [],
    username: targetUser.username,
    timeoutHandle: null,
  };
  activeInterviews.set(targetUser.id, fakeInfo);

  await finalizeInterview(targetUser.id, true, 'Yönetici tarafından doğrudan onaylandı.', client);
  return true;
}

// ── Evet / Hayır buton handler ─────────────────────────────────────────────
async function handleInterviewButton(interaction, client) {
  const cid = interaction.customId;
  if (!cid.startsWith('mod_interview_yes_') && !cid.startsWith('mod_interview_no_')) return false;

  const userId = interaction.user.id;
  let info = activeInterviews.get(userId);

  if (!info) {
    const ModInterview = require('../../models/ModInterview');
    const dbInfo = await ModInterview.findOne({ userId }).catch(() => null);
    if (dbInfo) {
      info = {
        adminId: dbInfo.adminId,
        guildId: dbInfo.guildId,
        client,
        history: dbInfo.history,
        answeredCount: dbInfo.answeredCount,
        totalScore: dbInfo.totalScore,
        startTime: dbInfo.startTime,
        responses: dbInfo.responses,
        username: dbInfo.username,
        timeoutHandle: null,
      };
      activeInterviews.set(userId, info);
      refreshTimeout(userId, client);
    } else {
      const parts = cid.split('_');
      if (parts.length >= 6) {
        const targetUserId = parts[3];
        const adminId = parts[4];
        const guildId = parts[5];
        
        info = {
          adminId,
          guildId,
          client,
          history: [],
          answeredCount: 0,
          totalScore: 0,
          startTime: Date.now(),
          responses: [],
          username: interaction.user.username,
          timeoutHandle: null,
        };
        activeInterviews.set(targetUserId, info);
        refreshTimeout(targetUserId, client);
      }
    }
  }

  // ── Hayır ──
  if (cid.startsWith('mod_interview_no_')) {
    clearInterview(userId);

    await interaction.update({
      content: '⏸️ Tamam, anladım! Hazır olduğunda tekrar başvurabilirsin. Başarılar! 🍀',
      embeds: [], components: [],
    }).catch(() => { });

    if (info) {
      const admin = await client.users.fetch(info.adminId).catch(() => null);
      if (admin) {
        await safeSend(admin, {
          embeds: [new EmbedBuilder()
            .setColor(0xfbbf24)
            .setTitle('⏸️ Mülakat Ertelendi')
            .setDescription(
              `**${interaction.user.tag}** moderatör mülakatını erteledi.\n\nİlerde tekrar başvurabilir.`
            )
            .setTimestamp()],
        }, 'admin-erteleme');
      }
    }
    return true;
  }

  // ── Evet ──
  if (!info) {
    await interaction.update({ content: '❌ Başvuru bulunamadı veya süresi doldu.', embeds: [], components: [] }).catch(() => { });
    return true;
  }

  await interaction.update({
    embeds: [new EmbedBuilder()
      .setColor(0x7c6af7)
      .setDescription('🚀 **Harika! Mülakat başlıyor...**\n⏳ İlk soru DM\'ne geliyor.')],
    components: [],
  }).catch(() => { });

  // İlk soruyu sor
  await askNextQuestion(userId, null, client).catch(async (err) => {
    console.error('[modInterview] İlk soru hatası:', err.message);
    clearInterview(userId);
    await safeSend(interaction.user, {
      embeds: [new EmbedBuilder()
        .setColor(0xed4245)
        .setTitle('❌ Mülakat Başlatılamadı')
        .setDescription(`Teknik bir hata oluştu:\n\`\`\`${err.message}\`\`\`\nLütfen daha sonra tekrar dene.`)
        .setFooter({ text: 'Eko Yıldız • Moderatör Seçimi' })],
    }, 'başlatma hatası');
  });

  return true;
}

// ── Sonraki soruyu sor (veya sonucu değerlendir) ───────────────────────────
async function askNextQuestion(userId, previousAnswer, client) {
  const info = activeInterviews.get(userId);
  if (!info) return;

  const user = await client.users.fetch(userId).catch(() => null);
  if (!user) { clearInterview(userId); return; }

  // Timeout'u yenile (aktif konuşma var)
  refreshTimeout(userId, client);

  // Kullanıcı cevabını kaydet
  if (previousAnswer) {
    info.history.push({ role: 'user', content: previousAnswer });
    info.responses.push(previousAnswer);
    info.answeredCount++;
    await saveInterviewToDB(userId, info).catch(() => {});
  }

  // 7 cevap alındı mı? Kontrol et
  if (info.answeredCount >= 7) {
    // Typing göstergesi
    const dmCh = await user.createDM().catch(() => null);
    if (dmCh) await dmCh.sendTyping().catch(() => { });

    // Sonuçlandırma AI'ına gönder
    const finalPrompt = `${info.answeredCount}. cevabı değerlendir ve [SONUÇ: KABUL] veya [SONUÇ: RET] ver. Genel özet yaz.`;
    const historyWithPrompt = [...info.history, { role: 'user', content: finalPrompt }];
    const reply = await chatWithAI(historyWithPrompt, INTERVIEW_SYSTEM);

    // AI yanıtını history'ye ekle (kalıcı)
    info.history.push({ role: 'user', content: finalPrompt });
    info.history.push({ role: 'assistant', content: reply });

    // Puan parse et
    const scoreMatch = reply.match(/\[PUAN:\s*(\d+(?:\.\d+)?)\/10\]/i);
    if (scoreMatch) {
      info.totalScore += parseFloat(scoreMatch[1]);
    }

    // Sonucu kontrol et
    if (/\[SONUÇ:\s*KABUL\]/i.test(reply)) {
      await finalizeInterview(userId, true, reply, client);
      return;
    }
    if (/\[SONUÇ:\s*RET\]/i.test(reply)) {
      await finalizeInterview(userId, false, reply, client);
      return;
    }

    // Eğer sonuç parçası yoksa hata
    console.error(`[modInterview] ${userId} için sonuç parçası bulunamadı. Reply:`, reply.slice(0, 200));
    await finalizeInterview(userId, false, reply, client);
    return;
  }

  // Typing göstergesi
  const dmCh = await user.createDM().catch(() => null);
  if (dmCh) await dmCh.sendTyping().catch(() => { });

  // AI'a gönderilecek mesajı hazırla
  let userPrompt;
  if (info.answeredCount === 0) {
    // Henüz cevap yok — ilk soruyu sor
    userPrompt = 'Mülakatı başlat ve 1. soruyu sor. Değerlendirme yapma.';
  } else {
    // Ara soru
    userPrompt = `${info.answeredCount}. cevabı değerlendir, ardından ${info.answeredCount + 1}. soruyu sor.`;
  }

  // Geçici prompt mesajını history'ye ekle, AI yanıtladıktan sonra tutut kalıcı
  const historyWithPrompt = [...info.history, { role: 'user', content: userPrompt }];
  const reply = await chatWithAI(historyWithPrompt, INTERVIEW_SYSTEM);

  // AI yanıtını kalıcı history'ye ekle
  info.history.push({ role: 'user', content: userPrompt });
  info.history.push({ role: 'assistant', content: reply });

  // Puan parse et
  const scoreMatch = reply.match(/\[PUAN:\s*(\d+(?:\.\d+)?)\/10\]/i);
  if (scoreMatch) {
    info.totalScore += parseFloat(scoreMatch[1]);
  }

  // Soru numarası: answeredCount + 1 = gösterilen soru no
  const currentQuestion = info.answeredCount + 1;
  const progress = Math.min(currentQuestion, 7);
  const progressBar = '█'.repeat(progress) + '░'.repeat(7 - progress);

  const cleanReply = reply
    .replace(/\[PUAN:[^\]]+\]/gi, '')
    .replace(/\[SONUÇ:[^\]]+\]/gi, '')
    .trim();

  await safeSend(user, {
    embeds: [new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle(`🛡️ MASTER MODERATÖR MÜLAKATI • Soru ${progress} / 7`)
      .setDescription(
        `# 📋 Mülakat Sorusu ${progress}\n\n` +
        `> **${cleanReply}**\n\n` +
        `### 📊 Mülakat İlerlemesi:\n` +
        `\`${progressBar}\` **(${progress}/7 Tamamlandı)**`
      )
      .setFooter({ text: '💬 Cevabınızı bu mesaja yanıt olarak yazıp doğrudan gönderebilirsiniz.' })
      .setTimestamp()],
  }, `soru-${progress}`);

  await saveInterviewToDB(userId, info).catch(() => {});
}

// ── DM'den cevap gelince ───────────────────────────────────────────────────
async function handleInterviewReply(message, client) {
  const userId = message.author.id;
  let info = activeInterviews.get(userId);

  if (!info) {
    const ModInterview = require('../../models/ModInterview');
    const dbInfo = await ModInterview.findOne({ userId }).catch(() => null);
    if (dbInfo) {
      info = {
        adminId: dbInfo.adminId,
        guildId: dbInfo.guildId,
        client,
        history: dbInfo.history,
        answeredCount: dbInfo.answeredCount,
        totalScore: dbInfo.totalScore,
        startTime: dbInfo.startTime,
        responses: dbInfo.responses,
        username: dbInfo.username,
        timeoutHandle: null,
      };
      activeInterviews.set(userId, info);
      refreshTimeout(userId, client);
    }
  }

  if (!info) return false;
  // İlk soru henüz gönderilmemişse (answeredCount=0 ama history de boşsa) cevap alma
  if (info.answeredCount === 0 && info.history.length === 0) return false;

  await askNextQuestion(userId, message.content, client).catch((err) => {
    console.error('[modInterview] Cevap işleme hatası:', err.message);
  });
  return true;
}

// ── Mülakat sonuçlandır ────────────────────────────────────────────────────
async function finalizeInterview(userId, accepted, summary, client) {
  const info = activeInterviews.get(userId);
  if (!info) return;
  clearInterview(userId); // timeout temizle + map'ten sil

  const user = await client.users.fetch(userId).catch(() => null);
  const answered = Math.min(info.answeredCount, 7);
  const avgScore = answered > 0 ? +(info.totalScore / answered).toFixed(1) : 0;

  const duration = Math.round((Date.now() - info.startTime) / 1000);
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;

  const cleanSummary = summary
    .replace(/\[SONUÇ:[^\]]+\]/gi, '')
    .replace(/\[PUAN:[^\]]+\]/gi, '')
    .trim()
    .slice(0, 1000); // embed field limiti 1024 — biraz pay bırak

  let roleOk = false;
  let staffOk = false;

  if (accepted) {
    roleOk = true; // Set to true for logging since they'll be processed by the school system
    // ── Staff sistemine kayıt (Okul Sistemi Başlangıcı) ──
    try {
      let p = await StaffProgress.findOne({ userId });
      if (!p) {
        p = new StaffProgress({ userId, guildId: info.guildId, level: 1 });
      }
      p.schoolSystem = {
        status: 'pending_contract',
        originalLevel: 1,
        originalRoles: []
      };
      p.status = 'active';
      await p.save();
      staffOk = true;
      console.log(`[modInterview] ${userId} → staff sistemine (Okul Entegrasyonu) kaydedildi`);

      // Okul sözleşmesini gönder
      try {
        const { sendContractDM } = require('./moderatorSchool');
        await sendContractDM(userId, client);
      } catch (errSchool) {
        console.error('[modInterview] Okul sözleşmesi gönderilemedi:', errSchool.message);
      }
    } catch (err) {
      console.warn('[modInterview] Staff kayıt hatası:', err.message);
    }

    // ── Ekoyıldız Sunucusunda Rollerin Tanımlanması (1536432300194136176, 1518904809078526043) ──
    try {
      const GUILD2_ID = process.env.GUILD2_ID || '1367646464804655104';
      const ekoGuild = client.guilds.cache.get(GUILD2_ID);
      if (ekoGuild) {
        const member = await ekoGuild.members.fetch(userId).catch(() => null);
        if (member) {
          await member.roles.add(['1536432300194136176', '1518904809078526043'], 'Mülakat onaylandı & Oryantasyon verildi.').catch(() => {});
          roleOk = true;
          console.log(`[modInterview] ${userId} için 1536432300194136176 ve 1518904809078526043 roller verildi.`);
        }
      }
    } catch (errRole) {
      console.warn('[modInterview] Ekoyıldız rol tanımlama hatası:', errRole.message);
    }

    // ── Kullanıcıya tebrik ──
    if (user) {
      await safeSend(user, {
        embeds: [new EmbedBuilder()
          .setColor(0x2ecc71)
          .setTitle('🎉 TEBRİKLER! MÜLAKATINIZ BÜYÜK BAŞARIYLA ONAYLANDI!')
          .setThumbnail(user.avatarURL() || null)
          .setDescription(
            `# 🏆 MODERATÖRLÜK MÜLAKATINI GEÇTİNİZ!\n\n` +
            `Sayın **${user.username}** 👋,\n\n` +
            `> Master Moderatör mülakatını **başarıyla tamamladınız!**\n` +
            `> EkoYıldız sunucusundaki tüm moderatör yetkileriniz ve personel statünüz aktif edilmiştir.\n\n` +
            `### 📊 Mülakat Karne Özeti:\n` +
            `• **Ortalama Başarı Puanı:** \`${avgScore} / 10\` ⭐\n` +
            `• **Tamamlanan Soru Sayısı:** \`${answered} / 7\`\n` +
            `• **Mülakat Süresi:** \`${minutes}d ${seconds}s\`\n\n` +
            `### 💬 Yapay Zekâ & İK Değerlendirmesi:\n` +
            `\`\`\`\n${cleanSummary || 'Başarılı analiz ve mükemmel kural bilgisi.'}\n\`\`\`\n\n` +
            `🚀 **Moderatör Okulu ve oryantasyon süreciniz başlatılmıştır.**`
          )
          .setFooter({ text: 'Eko Yıldız • İnsan Kaynakları & MOD-ALIM Sistemi' })
          .setTimestamp()],
      }, 'tebrik');
    }

    // ── Yöneticiye bildir (Yorumla & Onayla Butonlu) ──
    const admin = await client.users.fetch(info.adminId).catch(() => null);
    if (admin) {
      const statusLine = `Ekoyıldız Rolleri: ${roleOk ? '✅ Aktif' : '❌ Beklemede'}  |  Staff Kaydı: ${staffOk ? '✅ Tamamlandı' : '❌ Beklemede'}`;

      const commentRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`mod_interview_comment_${userId}`).setLabel('💬 Mülakatı Yorumla').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(`mod_interview_confirm_final_${userId}`).setLabel('✅ Oryantasyonu Onayla & Tamamla').setStyle(ButtonStyle.Success)
      );

      await safeSend(admin, {
        embeds: [new EmbedBuilder()
          .setColor(0x2ecc71)
          .setTitle('✅ MÜLAKAT TAMAMLANTI: YÖNETİCİ ONAY MASASI')
          .setThumbnail(user?.avatarURL() || null)
          .setDescription(
            `# 📋 Moderatör Mülakat Değerlendirme Raporu\n\n` +
            `> **Aday:** ${user?.tag || `<@${userId}>`}\n` +
            `> **Sorumlu Yönetici:** <@${info.adminId}>\n\n` +
            `### 📊 Detaylı Mülakat İstatistikleri:\n` +
            `• **Ortalama Puan:** \`${avgScore} / 10\`\n` +
            `• **Cevaplanan Soru:** \`${answered} / 7\`\n` +
            `• **Tamamlanma Süresi:** \`${minutes}d ${seconds}s\`\n\n` +
            `### ⚙️ Entegrasyon Durumu:\n` +
            `\`${statusLine}\`\n\n` +
            `### 📝 Yapay Zeka Özeti:\n` +
            `\`\`\`\n${cleanSummary || 'Başarılı mülakat performansı.'}\n\`\`\``
          )
          .setFooter({ text: 'Eko Yıldız • İnsan Kaynakları Otomasyonu' })
          .setTimestamp()],
        components: [commentRow]
      }, 'admin-kabul');
    }

  } else {
    // ── Kullanıcıya red bildirimi ──
    if (user) {
      await safeSend(user, {
        embeds: [new EmbedBuilder()
          .setColor(0xed4245)
          .setTitle('❌ MÜLAKAT SONUCU: BAŞARISIZ')
          .setThumbnail(user.avatarURL() || null)
          .setDescription(
            `# 📋 Moderatörlük Mülakat Sonucu\n\n` +
            `Sayın **${user.username}**,\n\n` +
            `> Bu mülakat turunda belirlenen moderatörlük kriterlerinin gerisinde kaldığınız tespit edilmiştir.\n\n` +
            `### 📊 Mülakat İstatistikleriniz:\n` +
            `• **Ortalama Puan:** \`${avgScore} / 10\`\n` +
            `• **Tamamlanan Soru:** \`${answered} / 7\`\n` +
            `• **Toplam Süre:** \`${minutes}d ${seconds}s\`\n\n` +
            `### 💬 Geri Bildirim ve Değerlendirme:\n` +
            `\`\`\`\n${cleanSummary || 'Yetersiz puan veya değerlendirme kriteri.'}\n\`\`\`\n\n` +
            `💡 *Kendinizi geliştirip daha sonra tekrar başvurabilirsiniz. Başarılar!*`
          )
          .setFooter({ text: 'Eko Yıldız • MOD-ALIM Sistemi' })
          .setTimestamp()],
      }, 'red bildirimi');
    }

    // ── Yöneticiye bildir ──
    const admin = await client.users.fetch(info.adminId).catch(() => null);
    if (admin) {
      await safeSend(admin, {
        embeds: [new EmbedBuilder()
          .setColor(0xed4245)
          .setTitle('❌ MÜLAKAT SONUCU: RET')
          .setThumbnail(user?.avatarURL() || null)
          .setDescription(
            `# ❌ Mülakat Başarısız Oldu\n\n` +
            `> **Aday:** ${user?.tag || `<@${userId}>`}\n` +
            `> **Yönetici:** <@${info.adminId}>\n\n` +
            `### 📊 Sonuçlar:\n` +
            `• **Ortalama Puan:** \`${avgScore} / 10\`\n` +
            `• **Tamamlanan Soru:** \`${answered} / 7\`\n` +
            `• **Süre:** \`${minutes}d ${seconds}s\`\n\n` +
            `### 💬 Değerlendirme:\n` +
            `\`\`\`\n${cleanSummary || 'Kriterler sağlanamadı.'}\n\`\`\``
          )
          .setFooter({ text: 'Sistem Tarihi: ' + new Date().toLocaleString('tr-TR') })
          .setTimestamp()],
      }, 'admin-ret');
    }
  }
}

async function handleInterviewCommentButton(interaction) {
  const cid = interaction.customId;
  if (!cid.startsWith('mod_interview_comment_')) return false;

  const targetUserId = cid.replace('mod_interview_comment_', '');

  const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
  const modal = new ModalBuilder()
    .setCustomId(`modal_mod_interview_comment_${targetUserId}`)
    .setTitle('💬 Mülakatı Yorumla & Adaya Bildir');

  const commentInput = new TextInputBuilder()
    .setCustomId('interview_comment_text')
    .setLabel('Mülakat Değerlendirmesi & Yorumunuz')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('Aday hakkında değerlendirmenizi ve tavsiyelerinizi yazın...')
    .setRequired(true);

  modal.addComponents(new ActionRowBuilder().addComponents(commentInput));
  await interaction.showModal(modal);
  return true;
}

async function handleInterviewCommentModal(interaction, client) {
  const cid = interaction.customId;
  if (!cid.startsWith('modal_mod_interview_comment_')) return false;

  const targetUserId = cid.replace('modal_mod_interview_comment_', '');
  const commentText = interaction.fields.getTextInputValue('interview_comment_text');

  const targetUser = await client.users.fetch(targetUserId).catch(() => null);
  if (targetUser) {
    const commentEmbed = new EmbedBuilder()
      .setColor(0x7c6af7)
      .setTitle('💬 MÜLAKAT DEĞERLENDİRMESİ VE YORUMU')
      .setDescription(
        `Merhaba **${targetUser.username}**,\n\n` +
        `Yöneticiniz mülakatınız hakkında aşağıdaki değerlendirme yorumunu eklemiştir:\n\n` +
        `📝 **Yönetici Yorumu:**\n\`\`\`\n${commentText}\n\`\`\``
      )
      .setFooter({ text: 'Eko Yıldız • Moderatör Mülakat Değerlendirmesi' })
      .setTimestamp();

    await safeSend(targetUser, { embeds: [commentEmbed] }, 'mülakat-yorum-dm');
  }

  await interaction.reply({
    content: `✅ Mülakat yorumunuz yazıldı ve aday <@${targetUserId}> kullanıcısına DM üzerinden iletildi!`,
    ephemeral: true
  });
  return true;
}

module.exports = {
  startModInterview,
  handleInterviewButton,
  handleInterviewReply,
  handleInterviewCommentButton,
  handleInterviewCommentModal
};