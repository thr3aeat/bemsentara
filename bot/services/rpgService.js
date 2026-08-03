'use strict';

const StaffProgress = require('../../models/StaffProgress');
const StaffGuild = require('../../models/StaffGuild');

// RPG Karakter Sınıfları
const RPG_CLASSES = {
  guardian: {
    id: 'guardian',
    name: '🛡️ Muhafız (Moderatör Sınıfı)',
    desc: 'Moderasyon ve kural ihlali işlemlerinden x2 kat puan kazanır.',
    emoji: '🛡️',
    targetCategory: 'mod'
  },
  guide: {
    id: 'guide',
    name: '🎧 Rehber (Ses & Sohbet Sınıfı)',
    desc: 'Ses kanallarında aktif kalmaktan ve sohbet mesajlarından x2 kat puan kazanır.',
    emoji: '🎧',
    targetCategory: 'voice_chat'
  },
  solver: {
    id: 'solver',
    name: '🎫 Çözücü (Ticket Sınıfı)',
    desc: 'Ticket çözmekten ve bilet kapatmaktan x2 kat puan kazanır.',
    emoji: '🎫',
    targetCategory: 'ticket'
  }
};

/**
 * Kullanıcının sınıf çarpanını hesaplar
 */
function getClassMultiplier(p, category) {
  if (!p || !p.rpgClass || !p.rpgClass.type || p.rpgClass.type === 'none') {
    return 1.0;
  }
  const cls = RPG_CLASSES[p.rpgClass.type];
  if (cls && cls.targetCategory === category) {
    return 2.0; // Sınıf bonusu x2
  }
  return 1.0;
}

/**
 * Karakter sınıfı seç / değiştir (Ayda 1 kez izin verilir)
 */
async function setUserClass(userId, classType) {
  const p = await StaffProgress.findOne({ userId });
  if (!p) return { success: false, message: 'Personel kaydı bulunamadı.' };
  if (!RPG_CLASSES[classType]) return { success: false, message: 'Geçersiz sınıf seçimi.' };

  const now = new Date();
  if (p.rpgClass?.lastSwitchedAt) {
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    if (p.rpgClass.lastSwitchedAt > monthAgo) {
      return { success: false, message: 'Sınıf değişimi sadece 30 günde bir yapılabilir!' };
    }
  }

  p.rpgClass = {
    type: classType,
    chosenAt: p.rpgClass?.chosenAt || now,
    lastSwitchedAt: now
  };

  await p.save();
  return { success: true, className: RPG_CLASSES[classType].name };
}

/**
 * Sonsuz Sezon — Prestij (Rebirth) İşlemi
 * Seviye 6 personelin seviyesini sıfırlayıp kalıcı pasif bonuslar verir
 */
async function handlePrestigeRebirth(userId, client = null) {
  const p = await StaffProgress.findOne({ userId });
  if (!p) return { success: false, message: 'Personel bulunamadı.' };

  const currentLevel = p.level || 1;
  if (currentLevel < 6) {
    return { success: false, message: 'Prestij (Rebirth) yapmak için Seviye 6 (Genel Koordinatör) rütbesine ulaşmalısınız!' };
  }

  p.prestige = p.prestige || { level: 0, title: '', multiplier: 1.0, rebirthCount: 0 };
  p.prestige.level = (p.prestige.level || 0) + 1;
  p.prestige.rebirthCount = (p.prestige.rebirthCount || 0) + 1;
  p.prestige.title = `[P-${p.prestige.level}]`;
  p.prestige.multiplier = 1.0 + (p.prestige.level * 0.10); // Her prestij seviyesi +%10 kalıcı bonus

  // Seviyeyi 1'e (Stajyer) sıfırla, izin kredisi ve ödül ver
  p.level = 1;
  p.leaves = p.leaves || {};
  p.leaves.totalCredits = (p.leaves.totalCredits || 0) + 1;

  if (!p.gamification) p.gamification = {};
  p.gamification.ecoCoins = (p.gamification.ecoCoins || 0) + 500;
  p.gamification.diamonds = (p.gamification.diamonds || 0) + 200;

  await p.save();

  if (client) {
    try {
      const user = await client.users.fetch(userId);
      const { EmbedBuilder } = require('discord.js');
      const embed = new EmbedBuilder()
        .setColor(0x9b59b6)
        .setTitle(`🌟 PRESTİJ (REBIRTH) BAŞARIYLA TAMAMLANDI!`)
        .setDescription(
          `Tebrikler! Seviye 6'yı tamamlayarak **Prestij ${p.prestige.level}** seviyesine ulaştın! 🚀\n\n` +
          `✨ **Yeni Unvanın:** \`${p.prestige.title}\`\n` +
          `🔥 **Kalıcı Ödül Çarpanın:** **x${p.prestige.multiplier.toFixed(1)}**\n` +
          `🎁 **Kazandığın Hediye:** +1 İzin Kredisi, +500 E.C. ve +200 Elmas (💎)\n\n` +
          `Şimdi Stajyer rütbesinden daha güçlü ve pasif bonuslarınla baştan tırmanabilirsin! 💪`
        )
        .setFooter({ text: 'Eko Yıldız • Sonsuz Sezon & Prestij' })
        .setTimestamp();
      await user.send({ embeds: [embed] }).catch(() => { });
    } catch (_) { }
  }

  return { success: true, prestigeLevel: p.prestige.level, title: p.prestige.title };
}

/**
 * Takdir & Bahşiş Aktarımı (Peer-to-Peer Recognition)
 */
async function tipPeer(senderUserId, targetUserId, amount, type = 'coins', client = null) {
  if (senderUserId === targetUserId) {
    return { success: false, message: 'Kendinize bahşiş veremezsiniz!' };
  }
  if (!amount || amount <= 0) {
    return { success: false, message: 'Geçerli bir miktar giriniz.' };
  }

  const sender = await StaffProgress.findOne({ userId: senderUserId });
  const receiver = await StaffProgress.findOne({ userId: targetUserId });
  if (!sender || !receiver) {
    return { success: false, message: 'Personel kayıtları bulunamadı.' };
  }

  sender.gamification = sender.gamification || {};
  receiver.gamification = receiver.gamification || {};

  if (type === 'coins') {
    if ((sender.gamification.ecoCoins || 0) < amount) {
      return { success: false, message: 'Yetersiz EkoCoin bakiyesi!' };
    }
    sender.gamification.ecoCoins -= amount;
    receiver.gamification.ecoCoins = (receiver.gamification.ecoCoins || 0) + amount;
  } else if (type === 'diamonds') {
    if ((sender.gamification.diamonds || 0) < amount) {
      return { success: false, message: 'Yetersiz Elmas bakiyesi!' };
    }
    sender.gamification.diamonds -= amount;
    receiver.gamification.diamonds = (receiver.gamification.diamonds || 0) + amount;
  }

  sender.peerRecognition = sender.peerRecognition || {};
  sender.peerRecognition.totalTippedCoins = (sender.peerRecognition.totalTippedCoins || 0) + amount;

  receiver.peerRecognition = receiver.peerRecognition || {};
  receiver.peerRecognition.receivedCardsThisWeek = (receiver.peerRecognition.receivedCardsThisWeek || 0) + 1;

  await sender.save();
  await receiver.save();

  if (client) {
    try {
      const targetUser = await client.users.fetch(targetUserId);
      const { EmbedBuilder } = require('discord.js');
      const embed = new EmbedBuilder()
        .setColor(0xf1c40f)
        .setTitle('💖 ARKADAŞINDAN TEŞEKKÜR & BAHŞİŞ GELDİ!')
        .setDescription(
          `<@${senderUserId}> sana yardımın için teşekkür olarak **${amount} ${type === 'coins' ? 'EkoCoin (E.C.)' : 'Elmas (💎)'}** bahşiş gönderdi! 🌟`
        )
        .setFooter({ text: 'Eko Yıldız • Dayanışma Sistemi' })
        .setTimestamp();
      await targetUser.send({ embeds: [embed] }).catch(() => { });
    } catch (_) { }
  }

  return { success: true, message: `<@${targetUserId}> kullanıcısına ${amount} ${type} bahşiş gönderildi!` };
}

/**
 * Yapay Zeka Mahkemesi Jüri Oylaması
 */
const activeJuryCases = new Map();

function createJuryCase(caseId, targetUserId, reason) {
  const caseData = {
    caseId,
    targetUserId,
    reason,
    votes: { approve: 0, pardon: 0 },
    votedJuries: new Set(),
    createdAt: Date.now()
  };
  activeJuryCases.set(caseId, caseData);
  return caseData;
}

async function voteJuryCase(juryUserId, caseId, voteOption, client = null) {
  const cData = activeJuryCases.get(caseId);
  if (!cData) return { success: false, message: 'Mahkeme davası bulunamadı veya süresi dolmuş.' };

  if (cData.votedJuries.has(juryUserId)) {
    return { success: false, message: 'Bu davada zaten oy kullandınız!' };
  }

  cData.votedJuries.add(juryUserId);
  if (voteOption === 'pardon') {
    cData.votes.pardon += 1;
  } else {
    cData.votes.approve += 1;
  }

  // Jüriye Adalet Elçisi Ödülü ver (+25 E.C. ve +10 Elmas)
  try {
    const jStaff = await StaffProgress.findOne({ userId: juryUserId });
    if (jStaff) {
      jStaff.gamification = jStaff.gamification || {};
      jStaff.gamification.ecoCoins = (jStaff.gamification.ecoCoins || 0) + 25;
      jStaff.gamification.diamonds = (jStaff.gamification.diamonds || 0) + 10;
      await jStaff.save();
    }
  } catch (_) { }

  // 3 oy tamamlandıysa kararı ver
  if (cData.votedJuries.size >= 3) {
    const isPardoned = cData.votes.pardon >= 2;
    activeJuryCases.delete(caseId);

    if (isPardoned) {
      // Affedildi — Uyarıyı kaldır
      try {
        const p = await StaffProgress.findOne({ userId: cData.targetUserId });
        if (p && p.warnings && p.warnings.inactivityCount > 0) {
          p.warnings.inactivityCount -= 1;
          p.warnings.count = p.warnings.inactivityCount;
          await p.save();
        }
      } catch (_) { }
    }

    if (client) {
      try {
        const u = await client.users.fetch(cData.targetUserId);
        const { EmbedBuilder } = require('discord.js');
        const embed = new EmbedBuilder()
          .setColor(isPardoned ? 0x2ecc71 : 0xe74c3c)
          .setTitle(isPardoned ? '⚖️ YAPAY ZEKA MAHKEMESİ: AFFEDİLDİNİZ!' : '⚖️ YAPAY ZEKA MAHKEMESİ: CEZA ONAYLANDI')
          .setDescription(
            `Jüri oylaması sonuçlandı (${cData.votes.pardon} Affet / ${cData.votes.approve} Onayla).\n\n` +
            (isPardoned
              ? '🎉 Jüri heyeti sizi haklı buldu ve uyarınız silindi!'
              : '⚠️ Jüri heyeti cezayı onayladı.')
          )
          .setFooter({ text: 'Eko Yıldız • Adalet & Mahkeme' })
          .setTimestamp();
        await u.send({ embeds: [embed] }).catch(() => { });
      } catch (_) { }
    }
  }

  return { success: true, votes: cData.votes };
}

module.exports = {
  RPG_CLASSES,
  getClassMultiplier,
  setUserClass,
  handlePrestigeRebirth,
  tipPeer,
  createJuryCase,
  voteJuryCase,
  activeJuryCases
};
