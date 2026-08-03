'use strict';

const { EmbedBuilder } = require('discord.js');
const FrogLevel = require('../../models/FrogLevel');

// ── EkoYıldız sunucu ID ─────────────────────────────────────────────────────
const FROG_GUILD_ID = process.env.FROG_GUILD_ID || '1367646464804655104';

// ── Kurbağa rol hiyerarşisi (küçükten büyüğe) ──────────────────────────────
const FROG_ROLES = [
  { level: 0, name: '🦖 Yavru Dinazor', id: '1518692402884378825' },
  { level: 1, name: '🦕 Uyanık Dinazor', id: '1518692401789796543' },
  { level: 2, name: '🧠 Zeki Dinazor', id: '1518703707750006874' },
  { level: 3, name: '👑 Efsane Dinazor', id: '1518703706911019068' },
  { level: 4, name: '👹 Boss Dinazor', id: '1518703706282135792' },
  { level: 5, name: '😎 Havalı Dinazor', id: '1518703705338413086' },
  { level: 6, name: '🔥 Olay Dinazor', id: '1518703704524718111' },
  { level: 7, name: '💥 Bela Dinazor', id: '1518703703585198341' },
  { level: 8, name: '🌪️ Kaos Dinazor', id: '1518703702947401938' },
  { level: 9, name: '⚡ Alpha Dinazor', id: '1518703702205010183' },
  { level: 10, name: '😇 İyi Dinazor', id: '1518703701793968139' },
  { level: 11, name: '🌀 Garip Dinazor', id: '1518703700741329098' },
  { level: 12, name: '🎮 Oyuncu Penguen', id: '1518703699936153621' },
  { level: 13, name: '🕶️ Havalı Penguen', id: '1518701811450773575' },
  { level: 14, name: '🚀 Hiper Penguen', id: '1518698914524561470' },
  { level: 15, name: '🌋 Volkanik Penguen', id: '1518696013148197047' },
  { level: 16, name: '🦖 Kral Penguen', id: '1518695643063910541' },
];

// ── Her seviye için gereken XP (Dengeli Artış Eğrisi) ────────────────────────
// 150 base XP, her seviyede %35 artış + seviye başı bonus XP (1.35 çarpan)
function xpToNextLevel(currentLevel) {
  return Math.floor(150 * Math.pow(1.35, currentLevel) + (currentLevel * 100));
}

// Toplam seviyeye ulaşmak için gereken XP
function totalXpForLevel(level) {
  let total = 0;
  for (let i = 0; i < level; i++) {
    total += xpToNextLevel(i);
  }
  return total;
}

// ── XP kaynakları ─────────────────────────────────────────────────────────
const XP_PER_MESSAGE = 5;   // Her mesajda kazanılan XP
const XP_PER_VOICE_MIN = 3;   // Her ses dakikasında kazanılan XP
const MSG_COOLDOWN_MS = 45 * 1000; // 45 saniye mesaj cooldown (sohbet kalitesi için ideal)

function todayStr() {
  const d = new Date(Date.now() + 3 * 60 * 60 * 1000); // TR Time UTC+3
  return d.toISOString().split('T')[0];
}

// ── Kullanıcı verisi al veya oluştur ──────────────────────────────────────
async function getOrCreate(userId) {
  let p = await FrogLevel.findOne({ userId });
  if (!p) {
    p = new FrogLevel({ userId, guildId: FROG_GUILD_ID });
    await p.save();
  }
  return p;
}

// ── Mevcut seviyeyi Discord rollerine göre belirle ────────────────────────
async function syncLevelFromRoles(member) {
  let highestLevel = -1;
  for (const fr of FROG_ROLES) {
    if (member.roles.cache.has(fr.id)) {
      if (fr.level > highestLevel) highestLevel = fr.level;
    }
  }
  return highestLevel; // -1 = kurbağa/dinazor rolü yok
}

const chatHistory = new Map(); // userId -> Array of timestamps

// ── Mesaj XP ekle ─────────────────────────────────────────────────────────
async function addMessageXP(member, client) {
  if (!member || !member.guild || !member.user) {
    console.warn('[frogLevel] Invalid member object in addMessageXP');
    return;
  }

  if (member.guild.id !== FROG_GUILD_ID) return;
  if (member.user.bot) return;

  const now = Date.now();
  let history = chatHistory.get(member.id) || [];
  history.push(now);
  history = history.filter(ts => (now - ts) < 15 * 60 * 1000);
  chatHistory.set(member.id, history);

  const p = await getOrCreate(member.id).catch(err => {
    console.error('[frogLevel] getOrCreate error in addMessageXP:', err.message);
    return null;
  });
  if (!p) return;

  // Hızlı Yazıcı Bonusu (Sessizce Arka Planda Aktifleşir, DM Spam Atmaz)
  const oldest = history[0];
  const boostWindowMs = 15 * 60 * 1000;
  const minimumMessages = 50;
  const minimumActivityMs = 12 * 60 * 1000;
  const notificationCooldownMs = 2 * 60 * 60 * 1000;
  const isBoostActive = p.doubleXpUntil && new Date(p.doubleXpUntil).getTime() > now;
  const lastNotificationAt = p.lastBoostNotificationAt ? new Date(p.lastBoostNotificationAt).getTime() : 0;
  const canActivateBoost = !isBoostActive && (!lastNotificationAt || (now - lastNotificationAt) >= notificationCooldownMs);

  if (history.length >= minimumMessages && oldest && (now - oldest) >= minimumActivityMs && canActivateBoost) {
    p.doubleXpUntil = new Date(now + boostWindowMs);
    p.lastBoostNotificationAt = new Date(now);
    await p.save().catch(() => { });
  }

  // Cooldown kontrolü (XP kazanımı için)
  if (p.lastMessageAt && (now - new Date(p.lastMessageAt).getTime()) < MSG_COOLDOWN_MS) return;

  // Eğer hiç seviye yoksa Discord rollerinden senkronize et
  if (p.level === 0 && p.xp === 0) {
    const discordLevel = await syncLevelFromRoles(member);
    if (discordLevel > 0) {
      p.level = discordLevel;
      p.xp = totalXpForLevel(discordLevel);
    }
  }

  // Double XP check
  let xpGain = XP_PER_MESSAGE;
  if (p.doubleXpUntil && new Date(p.doubleXpUntil) > new Date()) {
    xpGain *= 2;
  }

  // Server booster multiplier (2x XP)
  if (member.premiumSince) {
    xpGain = Math.ceil(xpGain * 2);
  }

  // 🎲 Lucky Drop (Şanslı Mesaj Bonusu - %5 Şansla 10-30 XP)
  if (Math.random() < 0.05) {
    const bonusXp = Math.floor(Math.random() * 20) + 10;
    xpGain += bonusXp;
  }

  // 📅 Günlük Seri / Giriş Bonusu (Günün ilk mesajında +50 XP)
  const today = todayStr();
  const lastMsgDate = p.lastMessageAt ? new Date(new Date(p.lastMessageAt).getTime() + 3 * 60 * 60 * 1000).toISOString().split('T')[0] : null;
  if (lastMsgDate !== today) {
    xpGain += 50; // Günün ilk mesajı için +50 XP bonus
    p.dailyStreak = (p.dailyStreak || 0) + 1;
  }

  p.xp += xpGain;
  p.totalMessages = (p.totalMessages || 0) + 1;
  p.lastMessageAt = new Date();
  await p.save();

  await checkLevelUp(p, member, client);
}

// ── Ses dakikası XP ekle ──────────────────────────────────────────────────
async function addVoiceXP(userId, minutes, client) {
  if (!userId || !minutes || minutes <= 0 || !client) {
    console.warn('[frogLevel] Invalid addVoiceXP parameters:', { userId, minutes, client: !!client });
    return;
  }

  try {
    const p = await getOrCreate(userId).catch(err => {
      console.error('[frogLevel] getOrCreate error in addVoiceXP:', err.message);
      return null;
    });
    if (!p) return;

    const guild = await client.guilds.fetch(FROG_GUILD_ID).catch(() => null);
    if (!guild) return;

    const member = await guild.members.fetch(userId).catch(() => null);

    // Double XP check
    let xpGain = minutes * XP_PER_VOICE_MIN;
    if (p.doubleXpUntil && new Date(p.doubleXpUntil) > new Date()) {
      xpGain *= 2;
    }

    // Server booster multiplier (2x XP)
    if (member && member.premiumSince) {
      xpGain = Math.ceil(xpGain * 2);
    }

    p.xp += xpGain;
    p.totalVoiceMinutes = (p.totalVoiceMinutes || 0) + minutes;
    await p.save().catch(err => {
      console.error('[frogLevel] Save failed during addVoiceXP:', err.message);
      throw err;
    });

    if (!member) return;

    await checkLevelUp(p, member, client).catch(err => {
      console.error('[frogLevel] checkLevelUp error:', err.message);
    });
  } catch (err) {
    console.error('[frogLevel] addVoiceXP fatal error:', err.message);
  }
}

// ── Seviye atladı mı kontrol et ──────────────────────────────────────────
async function checkLevelUp(p, member, client) {
  const maxLevel = FROG_ROLES.length - 1;
  if (p.level >= maxLevel) return;

  const needed = xpToNextLevel(p.level);
  const currentXP = p.xp - totalXpForLevel(p.level);

  if (currentXP >= needed) {
    await levelUp(p, member, client);
  }
}

// ── Seviye Rol ve Roblox Senkronizasyonu ──────────────────────────────────
async function syncRolesFromLevel(member, level, client) {
  try {
    const currentRoles = member.roles.cache.map(r => r.id);
    const targetRole = FROG_ROLES[level];

    const DINASOUR_FAMILY_ROLE = '1518706437730078941';
    const PENGUIN_FAMILY_ROLE = '1518706437327556638';

    // 🔧 FIX: Temizlenecek diğer tüm seviye rollerini bul (Yavru Dinazor dahil eski tüm kademeleri temizle!)
    const rolesToRemove = [];
    for (const fr of FROG_ROLES) {
      if (fr.level !== level && currentRoles.includes(fr.id)) {
        rolesToRemove.push(fr.id);
      }
    }

    // Family roles removal
    if (level >= 0 && level <= 11) {
      if (currentRoles.includes(PENGUIN_FAMILY_ROLE)) {
        rolesToRemove.push(PENGUIN_FAMILY_ROLE);
      }
    } else if (level >= 12 && level <= 16) {
      if (currentRoles.includes(DINASOUR_FAMILY_ROLE)) {
        rolesToRemove.push(DINASOUR_FAMILY_ROLE);
      }
    }

    if (rolesToRemove.length > 0) {
      await member.roles.remove(rolesToRemove, 'Seviye Rol Senkronizasyonu').catch(() => { });
    }

    const rolesToAdd = [];
    if (targetRole && !currentRoles.includes(targetRole.id)) {
      rolesToAdd.push(targetRole.id);
    }

    // Family roles addition
    if (level >= 0 && level <= 11) {
      if (!currentRoles.includes(DINASOUR_FAMILY_ROLE)) {
        rolesToAdd.push(DINASOUR_FAMILY_ROLE);
      }
    } else if (level >= 12 && level <= 16) {
      if (!currentRoles.includes(PENGUIN_FAMILY_ROLE)) {
        rolesToAdd.push(PENGUIN_FAMILY_ROLE);
      }
    }

    if (rolesToAdd.length > 0) {
      await member.roles.add(rolesToAdd, 'Seviye Rol Senkronizasyonu').catch(() => { });
    }

    // 2. Sezon (Penguen Hiyerarşisi) geçişinde Roblox grubunda rank 5 ver
    if (level >= 12 && member.guild.id === FROG_GUILD_ID) {
      try {
        const User = require('../../models/User');
        const dbUser = await User.findOne({ discordId: member.id });
        if (dbUser && dbUser.robloxId) {
          const robloxId = parseInt(dbUser.robloxId);
          if (!isNaN(robloxId)) {
            const noblox = require('noblox.js');
            const { ROBLOX } = require('./staffAutomation');

            await noblox.handleJoinRequest(ROBLOX.EKOYILDIZ, robloxId, true).catch(() => { });
            await noblox.setRank(ROBLOX.EKOYILDIZ, robloxId, 5).catch(err => {
              console.error(`[frogLevel] Failed to set rank 5 in EkoYildiz group for ${member.id}:`, err.message);
            });
            console.log(`[frogLevel] Successfully set rank 5 in EkoYildiz group for user ${member.id}`);
          }
        }
      } catch (err) {
        console.error('[frogLevel] Roblox rank sync error during Penguen transition:', err.message);
      }
    }
  } catch (err) {
    console.error('[frogLevel] syncRolesFromLevel error:', err.message);
  }
}

// ── Kurbağa seviye ve aile rolleri koruma/senkronize etme ───────────────────
async function enforceFrogRoles(member) {
  try {
    if (member.user.bot) return;
    const currentRoles = member.roles.cache.map(r => r.id);
    const level0RoleId = '1518692402884378825';

    // Hapisteki üyelerden Yavru Dinazor rolünü otomatik çıkar
    const hasHapisRole = member.roles.cache.some(r => r.name.toLowerCase().includes('hapis'));
    if (hasHapisRole) {
      if (currentRoles.includes(level0RoleId)) {
        await member.roles.remove(level0RoleId, 'Hapiste olduğu için Seviye 0 rolü alındı.').catch(() => { });
      }
      return;
    }

    // Üyenin sahip olduğu en yüksek seviyeyi belirle
    let currentLevel = -1;
    for (const fr of FROG_ROLES) {
      if (currentRoles.includes(fr.id)) {
        if (fr.level > currentLevel) currentLevel = fr.level;
      }
    }

    // Eğer hiç seviye rolü yoksa varsayılan olarak Yavru Dinazor ver
    if (currentLevel < 0) {
      await member.roles.add(level0RoleId, 'Varsayılan Yavru Dinazor Rolü').catch(() => { });
      return;
    }

    // Eğer seviye 1 veya daha üstündeyse syncRolesFromLevel ile temizleme/eşleme yap
    await syncRolesFromLevel(member, currentLevel, member.client);
  } catch (err) {
    console.error('[frogLevel] enforceFrogRoles error:', err.message);
  }
}

// ── Sunucu Boost Ödüllendirme ve Duyuru Sistemi ───────────────────────────
async function handleBoosterReward(member) {
  try {
    const userId = member.id;
    const client = member.client;

    // 1. XP ekle (+500 XP)
    const p = await getOrCreate(userId);
    p.xp = (p.xp || 0) + 500;
    await p.save();

    await checkLevelUp(p, member, client).catch(() => { });

    // 2. Yetkili bonusu kontrolü (+1500 E.C.)
    let staffRewarded = false;
    try {
      const StaffProgress = require('../../models/StaffProgress');
      const staff = await StaffProgress.findOne({ userId });
      if (staff) {
        if (!staff.gamification) {
          staff.gamification = { totalPoints: 0, ecoCoins: 0, level: 1, currentXP: 0, badges: {}, streak: { current: 0, longest: 0, brokenDays: 0 } };
        }
        staff.gamification.ecoCoins = (staff.gamification.ecoCoins || 0) + 1500;
        await staff.save();
        staffRewarded = true;
      }
    } catch (staffErr) {
      console.error('[frogLevel] Booster staff reward error:', staffErr.message);
    }

    // 3. Genel Sohbet Kanalı Duyurusu
    const guild = member.guild;
    const channel = guild.channels.cache.find(c =>
      c.isTextBased?.() &&
      (c.name.includes('genel') || c.name.includes('sohbet') || c.name.includes('general'))
    ) || guild.systemChannel;

    if (channel) {
      const boostChannelEmbed = new EmbedBuilder()
        .setColor(0xF47FFF) // Boost pembe rengi
        .setTitle('⚡ SUNUCUYA DESTEK VERİLDİ! ⚡')
        .setDescription(
          `**Kocaman Teşekkürler!** <@${userId}> sunucumuza boost basarak destekte bulundu! 💖✨\n\n` +
          `**Kazandığı Ayrıcalıklar & Ödüller:**\n` +
          `• 📈 **Kalıcı 2.0x XP Boostu** (Sohbet ve seste 2 kat daha hızlı seviye atlayacak!)\n` +
          `• 🎁 **+500 FrogLevel XP** ödülü profilinize eklendi!\n` +
          (staffRewarded ? `• 🪙 **+1500 EkoCoin (E.C.)** yetkili hesabınıza eklendi!\n` : '') +
          `• 👑 Sunucudaki özel **Booster** ayrıcalıkları aktif edildi!`
        )
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
        .setFooter({ text: 'Eko Yıldız • Server Booster Sistemi' })
        .setTimestamp();

      await channel.send({ content: `🎉 **TEBRİKLER!** <@${userId}>`, embeds: [boostChannelEmbed] }).catch(() => { });
    }

    // 4. Özel Booster DM Mesajı (Yüksek Öncelikli Görsel Embed - discord.js v14)
    try {
      const dmEmbed = new EmbedBuilder()
        .setColor(0xF47FFF) // Discord Boost Pembe Rengi
        .setTitle('💖 SUNUCUMUZA DESTEK OLDUĞUN İÇİN TEŞEKKÜRLER!')
        .setDescription(
          `Merhaba **${member.user.username}**,\n\n` +
          `Eko Yıldız sunucusuna yaptığın **Server Boost** desteği için minnettarız! 🎉\n` +
          `Desteğin karşılığında hesabına özel ayrıcalıklar tanımlandı:`
        )
        .addFields(
          { name: '⚡ Kalıcı XP Çarpanı', value: '`2.0x XP Boost` (Sohbet ve seste 2 kat daha hızlı seviye atlayacaksın)', inline: false },
          { name: '🎁 Bonus Hediye XP', value: '`+500 Frog Level XP` hesabına eklendi', inline: true }
        )
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 512 }))
        .setFooter({ text: 'Eko Yıldız • Server Booster Ayrıcalıkları' })
        .setTimestamp();

      if (staffRewarded) {
        dmEmbed.addFields({ name: '🪙 Yetkili Bonusu', value: '`+1500 EkoCoin (E.C.)` cüzdanınıza eklendi!', inline: true });
      }

      await member.user.send({ embeds: [dmEmbed] }).catch(() => { });
    } catch (_) { }

  } catch (err) {
    console.error('[frogLevel] handleBoosterReward error:', err.message);
  }
}

// ── Seviye atla ──────────────────────────────────────────────────────────
async function levelUp(p, member, client) {
  const oldLevel = p.level;
  const newLevel = oldLevel + 1;
  const maxLevel = FROG_ROLES.length - 1;

  if (newLevel > maxLevel) return;

  p.level = newLevel;
  p.promotions = p.promotions || [];
  p.promotions.push({ level: newLevel, date: new Date() });
  await p.save();

  // Rolleri ve Roblox rütbesini senkronize et
  await syncRolesFromLevel(member, newLevel, client);

  const isFinal = newLevel === maxLevel;
  const newRoleInfo = FROG_ROLES[newLevel];
  const isSeason2Transition = newLevel === 12;

  // ── Sunucu İçi Genel Duyuru (Her Seviye İçin Sohbet Kanalına) ─────────────
  try {
    const guild = member.guild;
    const channel = guild.channels.cache.find(c =>
      c.isTextBased?.() &&
      (c.name.includes('genel') || c.name.includes('sohbet') || c.name.includes('general'))
    ) || guild.systemChannel;

    if (channel) {
      const embed = new EmbedBuilder()
        .setColor(isFinal ? 0xFFD700 : (isSeason2Transition ? 0xE67E22 : 0x2ECC71))
        .setTitle(isFinal ? '🏆 EFSANEVİ UNVAN KAZANILDI!' : (isSeason2Transition ? '🐧 2. SEZONA GEÇİŞ YAPILDI!' : '🎉 SEVİYE ATLADI!'))
        .setDescription(`**<@${member.id}>** yeni bir kademeye ulaştı!\n\n` +
          `**Önceki Rütbe:** ${FROG_ROLES[oldLevel]?.name}\n` +
          `**Yeni Rütbe:** **${newRoleInfo.name}**`)
        .addFields(
          { name: '📊 Seviye', value: `\`${newLevel} / ${maxLevel}\``, inline: true },
          { name: '✨ Toplam XP', value: `\`${p.xp.toLocaleString()} XP\``, inline: true }
        )
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
        .setFooter({ text: 'Eko Yıldız • Seviye Sistemi', iconURL: guild.iconURL() })
        .setTimestamp();

      await channel.send({ content: `<@${member.id}>`, embeds: [embed] });
    }
  } catch (err) {
    console.warn('[frogLevel] Kanal mesajı gönderilemedi:', err.message);
  }

  // ── DM BİLDİRİM SİSTEMİ (Sadece Yüksek / Kritik Olaylarda) ───────────────
  // Sadece Seviye 12 (2. Sezon - Penguen Sezonu) veya Seviye 16 (Max Level) durumunda DM gönderilir.
  if (isSeason2Transition || isFinal) {
    try {
      const dmEmbed = new EmbedBuilder()
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 512 }))
        .setTimestamp();

      if (isSeason2Transition) {
        dmEmbed
          .setColor(0xE67E22)
          .setTitle('🚀 BÜYÜK BAŞARI: 2. SEZON BAŞLADI!')
          .setDescription(
            `Tebrikler **${member.displayName}**! 🎉\n\n` +
            `İlk sezonu başarıyla tamamlayıp **2. Sezona (Penguen Sezonu)** adım attın! Artık sunucunun en kıdemli üyelerinden birisin.\n\n` +
            `🔹 **Yeni Unvanın:** ${newRoleInfo.name}\n` +
            `🔹 **Kazanılan Ayrıcalık:** Roblox grubunda otomatik Seviye 5 yetkisi tanımlandı!`
          )
          .addFields(
            { name: '🔥 Sonraki Hedef', value: 'Penguen hiyerarşisinde zirveye oynamaya devam et!', inline: false }
          )
          .setFooter({ text: 'Eko Yıldız • Sezon 2 Seviye Ödülü' });
      } else if (isFinal) {
        dmEmbed
          .setColor(0xFFD700)
          .setTitle('👑 ZİRVEYE ULAŞTIN! MAKSİMUM SEVİYE!')
          .setDescription(
            `**İnanılmaz Bir Başarı!** 🏆\n\n` +
            `Sayın **${member.displayName}**, Eko Yıldız sunucusundaki tüm seviye yolculuğunu tamamlayarak **Maksimum Seviyeye** ulaştın!\n\n` +
            `👑 **Açılan Son Rol:** **${newRoleInfo.name}**\n` +
            `⭐ **Toplam Biriken XP:** \`${p.xp.toLocaleString()} XP\``
          )
          .addFields(
            { name: '💎 Sunucu Efsanesi', value: 'Artık sunucunun en üst düzey ve saygın üyelerinden birisin. Emeklerin için teşekkürler!', inline: false }
          )
          .setFooter({ text: 'Eko Yıldız • Şampiyonlar Kulübü' });
      }

      await member.user.send({ embeds: [dmEmbed] }).catch(() => {
        console.log(`[frogLevel] DM kapalı olduğu için ${member.user.tag} kullanıcısına bildirim gönderilemedi.`);
      });
    } catch (err) {
      console.warn('[frogLevel] Özel DM gönderme hatası:', err.message);
    }
  }

  // Sonraki seviye kontrolü
  if (newLevel < maxLevel) {
    await checkLevelUp(p, member, client);
  }
}

// ── Kurbağa profilini göster ──────────────────────────────────────────────
async function getFrogProfile(userId, client) {
  const p = await FrogLevel.findOne({ userId });
  if (!p) return null;

  const currentRole = FROG_ROLES[p.level];
  const nextRole = FROG_ROLES[p.level + 1];
  const currentXP = Math.max(0, p.xp - totalXpForLevel(p.level));
  const neededXP = p.level < FROG_ROLES.length - 1 ? xpToNextLevel(p.level) : 0;
  const progress = neededXP > 0 ? Math.min(10, Math.max(0, Math.floor((currentXP / neededXP) * 10))) : 10;
  const bar = '█'.repeat(progress) + '░'.repeat(10 - progress);

  return {
    level: p.level,
    xp: p.xp,
    currentXP,
    neededXP,
    bar,
    currentRole,
    nextRole,
    totalMessages: p.totalMessages,
    totalVoiceMinutes: p.totalVoiceMinutes,
    promotions: p.promotions || [],
    profileColor: p.profileColor || null,
    profileBio: p.profileBio || null,
    customRoleId: p.customRoleId || null,
  };
}

// ── Ses oturumu takibi (map) ──────────────────────────────────────────────
const voiceSessions = new Map(); // userId → joinedAt (timestamp)

function onVoiceJoin(userId) {
  voiceSessions.set(userId, Date.now());
}

function onVoiceLeave(userId) {
  const joined = voiceSessions.get(userId);
  voiceSessions.delete(userId);
  if (!joined) return 0;
  return Math.floor((Date.now() - joined) / 60000); // dakika
}

async function getFrogLeaderboard() {
  return await FrogLevel.find({ xp: { $gt: 0 } })
    .sort({ xp: -1 })
    .limit(10);
}

// Clean up chatHistory map every 15 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [userId, history] of chatHistory.entries()) {
    const active = history.filter(ts => (now - ts) < 15 * 60 * 1000);
    if (active.length === 0) {
      chatHistory.delete(userId);
    } else {
      chatHistory.set(userId, active);
    }
  }
}, 15 * 60 * 1000).unref();

async function addXPDirectly(member, xpAmount, client) {
  try {
    const p = await getOrCreate(member.id);
    if (!p) return;

    p.xp += xpAmount;
    await p.save();

    await checkLevelUp(p, member, client);
  } catch (err) {
    console.error('[frogLevel] addXPDirectly fatal error:', err.message);
  }
}

async function awardGameXP(member, client, { amount, reason, details = '', multiplier = 1, staffBonus = 0 }) {
  try {
    if (!member || !member.user || member.user.bot) return null;

    const p = await getOrCreate(member.id);
    if (!p) return null;

    p.xp = (p.xp || 0) + Number(amount || 0);
    await p.save().catch(err => {
      console.error('[frogLevel] awardGameXP save error:', err.message);
      throw err;
    });

    await checkLevelUp(p, member, client).catch(err => {
      console.error('[frogLevel] awardGameXP level check error:', err.message);
    });

    const rewardText = [
      `🎮 ${reason} için Frog XP kazandın!`,
      `• Toplam: +${Number(amount || 0)} XP`,
    ];
    if (multiplier > 1) rewardText.push(`• Hız bonusu: x${multiplier.toFixed(1)}`);
    if (staffBonus > 0) rewardText.push(`• Yetkili bonusu: +${staffBonus} XP`);
    if (details) rewardText.push(`• ${details}`);

    return { amount: Number(amount || 0), multiplier, staffBonus, reason };
  } catch (err) {
    console.error('[frogLevel] awardGameXP fatal error:', err.message);
    return null;
  }
}

module.exports = {
  addMessageXP,
  addVoiceXP,
  getFrogProfile,
  onVoiceJoin,
  onVoiceLeave,
  FROG_ROLES,
  FROG_GUILD_ID,
  xpToNextLevel,
  totalXpForLevel,
  getFrogLeaderboard,
  syncRolesFromLevel,
  enforceFrogRoles,
  handleBoosterReward,
  addXPDirectly,
  awardGameXP,
};
