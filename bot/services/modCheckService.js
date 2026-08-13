'use strict';

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const cron = require('node-cron');
const { collections } = require('../../models/Store');
const StaffProgress = require('../../models/StaffProgress');
const { chatWithAI } = require('./aiService');
const logger = require('../../utils/logger');
const { ADMIN_IDS } = require('../../config');

const ADMIN_TARGET_ID = '1031620522406072350';
const modCheckSystemStore = collections.modCheckSystem;

/**
 * Moderatör kontrol verisini getirir veya gerekirse oluşturur.
 */
function getModCheckRecord(userId, createIfMissing = true) {
  let record = modCheckSystemStore.findOne({ userId });
  if (!record && createIfMissing) {
    record = modCheckSystemStore.create({
      userId,
      enabled: true,
      missedCount: 0,
      lastSentAt: new Date(),
      lastRespondedAt: null,
      status: 'none',
      lastResponse: null,
    });
  }
  return record;
}

/**
 * 2 günde bir AI ipucu üretir
 */
async function generateModTip() {
  const prompt = `Sen Sentara & EkoYıldız topluluklarının baş yönetim danışmanısın.
Moderatörler için ilgi çekici, öğretici ve kısa (maksimum 250 karakter) "İdeal bir moderatör nasıl olmalı?" ipucu/tavsiyesi yaz.
Kurallar:
- Dil Türkçe ve profesyonel/motive edici olsun.
- Sadece ipucu metnini dön, ekstra başlık veya tırnak işareti koyma.`;

  try {
    const aiResponse = await chatWithAI([{ role: 'user', content: prompt }], null, 'ticket', { max_tokens: 200, temperature: 0.7 });
    if (aiResponse && aiResponse.trim()) {
      return aiResponse.trim();
    }
  } catch (err) {
    logger.warn(`[modCheckService] AI tip generation failed: ${err.message}`);
  }

  // Fallback ipuçları
  const fallbacks = [
    'İdeal bir moderatör, üyelere her zaman sabırlı, adil ve tarafsız yaklaşır. Sorunları tırmandırmak yerine sükunetle çözer.',
    'Etkili bir moderasyon, kuralları herkese eşit uygulamaktan geçer. Şahsi duygular kararlara yansıtılmamalıdır.',
    'Birim içi iletişim bir moderatörün en büyük silahıdır. Vardiya devirlerinde bilet ve olay notlarını eksiksiz aktarın.',
    'Kullanıcılardan gelen sorulara açıklayıcı ve yardımsever yanıtlar vermek topluluk güvenini artırır.',
    'Moderatörlük sadece ceza vermek değil, toplulukta huzurlu ve saygılı bir sohbet ortamı oluşturmaktır.'
  ];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

/**
 * Her 2 günde bir SADECE .modcheck ile eklenmiş aktif moderatörlere DM kontrolü çalıştırır
 */
async function runModCheckCycle(client) {
  logger.info('[modCheckService] 2 Günlük Moderatör Kontrol Döngüsü Çalıştırılıyor...');

  try {
    // SADECE sistemde kayıtlı ve enabled: true olan moderatörleri al (Rastgele mod olmayan kimseye atılmaz)
    const enabledRecords = modCheckSystemStore.find({ enabled: true }) || [];
    const now = new Date();
    const TWO_DAYS_MS = 48 * 60 * 60 * 1000;

    for (const record of enabledRecords) {
      if (!record || record.enabled === false) continue;
      const userId = String(record.userId);

      // Daha önce mesaj gönderilmiş ve 2 gün (48 saat) geçmiş mi kontrol et
      const lastSent = record.lastSentAt ? new Date(record.lastSentAt).getTime() : 0;
      const timeDiff = now.getTime() - lastSent;

      // Eğer 48 saati doldurduysa
      if (lastSent > 0 && timeDiff >= TWO_DAYS_MS) {

        // Eğer önceki mesaj "pending" kaldıysa (yanıt vermediyse) missedCount artır
        if (record.status === 'pending') {
          record.missedCount = (record.missedCount || 0) + 1;
        }

        // Eğer 2 kez üst üste yanıt atılmadıysa Admin DM'ine bildir ve "KAPAT" butonu koy
        if (record.missedCount >= 2) {
          try {
            const adminUser = await client.users.fetch(ADMIN_TARGET_ID).catch(() => null);
            if (adminUser) {
              const alertEmbed = new EmbedBuilder()
                .setColor(0xE74C3C)
                .setTitle('⚠️ Moderatör Katılım Uyarısı (2 Cezasız Geçiş)')
                .setDescription(`Moderatör <@${userId}> (ID: \`${userId}\`) **2 kez üst üste** 2 günlük kontrol DM'ine yanıt vermedi.`)
                .addFields(
                  { name: 'Kullanıcı:', value: `<@${userId}> (\`${userId}\`)`, inline: true },
                  { name: 'Yanıtsız Sayısı:', value: `${record.missedCount} kez`, inline: true }
                )
                .setFooter({ text: 'Aşağıdaki butona basarak bu moderatörün kontrol sistemini kapatabilirsiniz.' })
                .setTimestamp();

              const adminRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                  .setCustomId(`modcheck_kapat_${userId}`)
                  .setLabel('KAPAT')
                  .setStyle(ButtonStyle.Danger)
                  .setEmoji('🛑')
              );

              await adminUser.send({ embeds: [alertEmbed], components: [adminRow] }).catch((err) => {
                logger.warn(`[modCheckService] Could not send DM to admin ${ADMIN_TARGET_ID}: ${err.message}`);
              });
            }
          } catch (adminErr) {
            logger.error(`[modCheckService] Admin notification error: ${adminErr.message}`);
          }
        }

        // Eğer hâlâ aktifse ve kapatılmadıysa yeni IPUCU ve BURADAYIM butonlu DM gönder
        if (record.enabled !== false) {
          const tipText = await generateModTip();

          const dmEmbed = new EmbedBuilder()
            .setColor(0x3498DB)
            .setTitle('💡 2 Günlük Moderatör Gelişim & Kontrol İpucu')
            .setDescription(`Merhaba Yetkilimiz! 👋\nHer 2 günde bir gönderilen düzenli moderatör gelişim ipucunuz:\n\n> *"${tipText}"*\n\n**Moderatör Nasıl Olmalı?**\nAktifliğinizi doğrulamak ve ipucunu okuduğunuzu teyit etmek için lütfen aşağıdaki **BURADAYIM** butonuna tıklayınız.`)
            .setFooter({ text: 'Sentara & EkoYıldız Yönetim Sistemi • 2 Günlük Kontrol' })
            .setTimestamp();

          const dmRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`modcheck_buradayim_${userId}_${Date.now()}`)
              .setLabel('BURADAYIM')
              .setStyle(ButtonStyle.Success)
              .setEmoji('✋')
          );

          try {
            const discordUser = await client.users.fetch(userId).catch(() => null);
            if (discordUser) {
              await discordUser.send({ embeds: [dmEmbed], components: [dmRow] });
              record.lastSentAt = new Date();
              record.status = 'pending';
              await record.save();
              logger.info(`[modCheckService] Sent 2-day DM tip to moderator ${userId}`);
            }
          } catch (dmErr) {
            logger.warn(`[modCheckService] Could not send DM to mod ${userId}: ${dmErr.message}`);
          }
        }
      }
    }
  } catch (err) {
    logger.error(`[modCheckService] Cycle error: ${err.message}`);
  }
}

/**
 * Cron scheduler başlatır (Her gün 12:00'de kontrol eder, 48h saati geçenlere atar)
 */
function initModCheckScheduler(client) {
  logger.info('[modCheckService] Moderatör 2 günlük DM kontrol zamanlayıcısı kuruluyor...');
  
  // Her gün 12:00 saatinde tetiklenir
  cron.schedule('0 12 * * *', async () => {
    await runModCheckCycle(client);
  });

  // İlk başlatmada test/kontrol için 30 sn sonra da kontrol edebilir
  setTimeout(() => {
    runModCheckCycle(client).catch((err) => logger.error(`[modCheckService] Initial run error: ${err.message}`));
  }, 30000);
}

/**
 * Buton Etkileşim Yöneticisi
 */
async function handleModCheckButton(interaction) {
  const { customId, user } = interaction;

  // 1) "BURADAYIM" Butonu
  if (customId.startsWith('modcheck_buradayim_')) {
    const parts = customId.split('_');
    const targetUserId = parts[2];

    if (user.id !== targetUserId) {
      return interaction.reply({ content: '❌ Bu buton sadece size özel gönderilen mesajlar içindir.', ephemeral: true });
    }

    const tipEmbed = new EmbedBuilder()
      .setColor(0x9B59B6)
      .setTitle('📚 Moderatör Nasıl Olmalı? (3 Temel İlke)')
      .setDescription('Tebrikler! İpucu kontrolüne katıldınız. İdeal bir moderatörün sahip olması gereken 3 temel madde:')
      .addFields(
        { name: '1️⃣ Etkili & Sabırlı İletişim', value: 'Kullanıcılara karşı her zaman net, nazik ve çözüm odaklı yaklaşın.', inline: false },
        { name: '2️⃣ Kurallarda Adalet & Tarafsızlık', value: 'Duygu ve şahsi ilişkilerinizi kararlarınıza karıştırmadan objektif olun.', inline: false },
        { name: '3️⃣ Ekip İçi Bilgi Akışı & Uyum', value: 'Vardiya ve bilet devirlerinde detaylı notlar bırakarak ekip arkadaşlarınızı destekleyin.', inline: false }
      )
      .setFooter({ text: 'Lütfen yukarıdaki 3 maddeyi okuyup aşağıdaki onay butonuna basınız.' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`modcheck_anladim_${user.id}`)
        .setLabel('ANLADIM')
        .setStyle(ButtonStyle.Success)
        .setEmoji('✅'),
      new ButtonBuilder()
        .setCustomId(`modcheck_anlamadim_${user.id}`)
        .setLabel('ANLAMADIM')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('❓')
    );

    return interaction.update({ embeds: [tipEmbed], components: [row] });
  }

  // 2) "ANLADIM" veya "ANLAMADIM" Butonu
  if (customId.startsWith('modcheck_anladim_') || customId.startsWith('modcheck_anlamadim_')) {
    const isAnladim = customId.startsWith('modcheck_anladim_');
    const targetUserId = customId.split('_')[2] || user.id;

    if (user.id !== targetUserId) {
      return interaction.reply({ content: '❌ Bu işlem sadece size özeldir.', ephemeral: true });
    }

    let record = getModCheckRecord(user.id, true);
    if (!record) {
      record = getModCheckRecord(targetUserId, true);
    }
    if (record) {
      record.missedCount = 0;
      record.lastRespondedAt = new Date();
      record.status = 'answered';
      record.lastResponse = isAnladim ? 'ANLADIM' : 'ANLAMADIM';
      if (typeof record.save === 'function') {
        await record.save();
      }
    }

    const responseEmbed = new EmbedBuilder()
      .setColor(isAnladim ? 0x2ECC71 : 0xE67E22)
      .setTitle('KAYDEDİLDİ!')
      .setDescription(
        isAnladim
          ? '✅ **Katılımınız ve anlayışınız kaydedildi!** 2 günlük moderatör kontrolünü başarıyla tamamladınız. Teşekkür ederiz!'
          : '⚠️ **Geri bildiriminiz kaydedildi!** Anlamadığınız hususlar veya destek için üst yönetime veya koçunuza danışabilirsiniz.'
      )
      .setFooter({ text: 'Sentara & EkoYıldız Yönetim Sistemi' })
      .setTimestamp();

    // Butonları deaktif et
    const disabledRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('modcheck_done_disabled')
        .setLabel('KAYDEDİLDİ!')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true)
    );

    return interaction.update({ embeds: [responseEmbed], components: [disabledRow] });
  }

  // 3) Admin "KAPAT" Butonu
  if (customId.startsWith('modcheck_kapat_')) {
    const targetUserId = customId.split('_')[2];

    // Yetki kontrolü (Admin veya belirlenen ID)
    const isAdmin = ADMIN_IDS.includes(user.id) || user.id === ADMIN_TARGET_ID;
    if (!isAdmin) {
      return interaction.reply({ content: '❌ Bu butonu kullanma yetkiniz bulunmamaktadır.', ephemeral: true });
    }

    const record = getModCheckRecord(targetUserId);
    record.enabled = false;
    record.status = 'closed';
    await record.save();

    // Yetkiliye kapatılma DM'i at
    try {
      const targetUser = await interaction.client.users.fetch(targetUserId).catch(() => null);
      if (targetUser) {
        const closedEmbed = new EmbedBuilder()
          .setColor(0xE74C3C)
          .setTitle('⚠️ MOD KONTROL SİSTEMİNİZ KAPATILDI')
          .setDescription('2 kez üst üste 2 günlük gelişim ve kontrol mesajlarına yanıt vermediğiniz için moderatör kontrol sisteminiz pasife alındı.\n\n*Not: Moderatör verileriniz korunmaktadır, herhangi bir veri silinmemiştir.*\n\nSistemi tekrar açtırmak için üst yönetime başvurunuz.')
          .setTimestamp();

        await targetUser.send({ embeds: [closedEmbed] }).catch(() => {});
      }
    } catch (dmErr) {
      logger.warn(`[modCheckService] Failed to send deletion DM to mod ${targetUserId}: ${dmErr.message}`);
    }

    const adminConfirmEmbed = new EmbedBuilder()
      .setColor(0x2ECC71)
      .setTitle('🛑 Moderatör Kontrolü Kapatıldı')
      .setDescription(`Moderatör <@${targetUserId}> (\`${targetUserId}\`) için 2 günlük kontrol sistemi kapatıldı ve kullanıcıya bildirim gönderildi.`)
      .setTimestamp();

    const disabledRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('modcheck_kapat_done')
        .setLabel('KAPATILDI')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true)
    );

    return interaction.update({ embeds: [adminConfirmEmbed], components: [disabledRow] });
  }
}

/**
 * Admin tarafından ID girilerek moderatör kontrolünü kaydetme / yeniden açma
 */
async function reopenModCheck(client, adminUser, modUserId) {
  let record = modCheckSystemStore.findOne({ userId: modUserId });
  if (!record) {
    record = modCheckSystemStore.create({
      userId: modUserId,
      enabled: true,
      missedCount: 0,
      lastSentAt: null,
      lastRespondedAt: null,
      status: 'none',
      lastResponse: null,
    });
  } else {
    record.enabled = true;
    record.missedCount = 0;
    record.status = 'reopened';
  }

  // Hemen 2 günlük ilk AI ipucunu ve BURADAYIM butonunu gönder
  const tipText = await generateModTip();

  const dmEmbed = new EmbedBuilder()
    .setColor(0x3498DB)
    .setTitle('💡 2 Günlük Moderatör Gelişim & Kontrol İpucu')
    .setDescription(`Merhaba Yetkilimiz! 👋\nYönetim tarafından 2 günlük moderatör katılım ve gelişim kontrol sisteminiz aktifleştirildi.\n\nİpucunuz:\n> *"${tipText}"*\n\n**Moderatör Nasıl Olmalı?**\nAktifliğinizi doğrulamak ve ipucunu okuduğunuzu teyit etmek için lütfen aşağıdaki **BURADAYIM** butonuna tıklayınız.`)
    .setFooter({ text: 'Sentara & EkoYıldız Yönetim Sistemi • 2 Günlük Kontrol' })
    .setTimestamp();

  const dmRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`modcheck_buradayim_${modUserId}_${Date.now()}`)
      .setLabel('BURADAYIM')
      .setStyle(ButtonStyle.Success)
      .setEmoji('✋')
  );

  try {
    const targetUser = await client.users.fetch(modUserId).catch(() => null);
    if (targetUser) {
      await targetUser.send({ embeds: [dmEmbed], components: [dmRow] });
      record.lastSentAt = new Date();
      record.status = 'pending';
      await record.save();
      logger.info(`[modCheckService] Activated and sent DM tip to moderator ${modUserId}`);
    }
  } catch (err) {
    logger.warn(`[modCheckService] Could not send initial DM to mod ${modUserId}: ${err.message}`);
    record.lastSentAt = new Date();
    await record.save();
  }

  return true;
}

/**
 * Moderatör kontrolünü açmak için Modal pencerisi gösterir
 */
async function handleModCheckOpenModal(interaction) {
  const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
  const isAdmin = ADMIN_IDS.includes(interaction.user.id) || interaction.user.id === ADMIN_TARGET_ID || interaction.member?.permissions?.has('Administrator');
  
  if (!isAdmin) {
    return interaction.reply({ content: '❌ Bu işlemi gerçekleştirmek için **yönetici** yetkisine sahip olmalısınız.', ephemeral: true });
  }

  const modal = new ModalBuilder()
    .setCustomId('modal_modcheck_open')
    .setTitle('Moderatör Kontrolünü Aç');

  const idInput = new TextInputBuilder()
    .setCustomId('modcheck_target_id')
    .setLabel('Moderatör Discord User ID')
    .setPlaceholder('Örn: 1031620522406072350')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  modal.addComponents(new ActionRowBuilder().addComponents(idInput));
  return interaction.showModal(modal);
}

/**
 * Modal submit gönderildiğinde çalışır
 */
async function handleModCheckOpenSubmit(interaction) {
  const targetId = interaction.fields.getTextInputValue('modcheck_target_id')?.trim();

  if (!targetId || !/^\d{17,20}$/.test(targetId)) {
    return interaction.reply({ content: '❌ Geçersiz Discord Kullanıcı ID\'si girdiniz. Lütfen 17-20 haneli sayısal ID giriniz.', ephemeral: true });
  }

  try {
    await reopenModCheck(interaction.client, interaction.user, targetId);

    const embed = new EmbedBuilder()
      .setColor(0x2ECC71)
      .setTitle('✅ Moderatör Kontrolü Aktifleştirildi')
      .setDescription(`<@${targetId}> (\`${targetId}\`) kullanıcısının 2 günlük DM ipucu ve kontrol sistemi başarıyla yeniden aktif edildi.`)
      .setTimestamp();

    return interaction.reply({ embeds: [embed], ephemeral: true });
  } catch (err) {
    return interaction.reply({ content: `❌ İşlem sırasında bir hata oluştu: ${err.message}`, ephemeral: true });
  }
}

module.exports = {
  getModCheckRecord,
  generateModTip,
  runModCheckCycle,
  initModCheckScheduler,
  handleModCheckButton,
  reopenModCheck,
  handleModCheckOpenModal,
  handleModCheckOpenSubmit,
  ADMIN_TARGET_ID
};
