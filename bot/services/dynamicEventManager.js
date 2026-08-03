'use strict';

// Dynamic World Events Manager (Rastgele Dünya Olayları)
let activeEvent = null;

const EVENT_TYPES = {
  CRISIS_TICKET: {
    id: 'CRISIS_TICKET',
    title: '🚨 ACİL DURUM: Sistem Sızıntısı & Ticket Görevi!',
    desc: 'Önümüzdeki 30 dakika boyunca çözülen her Ticket x3 Elmas kazandırıyor!',
    multiplier: 3.0,
    category: 'ticket',
    durationMinutes: 30
  },
  HAPPY_HOUR_VOICE: {
    id: 'HAPPY_HOUR_VOICE',
    title: '⚡ MUTLU SAATLER (Happy Hour): Ses Kanalları!',
    desc: 'Önümüzdeki 2 saat boyunca Ses Kanalında geçirilen süre x2 XP ve x2 Elmas kazandırıyor!',
    multiplier: 2.0,
    category: 'voice',
    durationMinutes: 120
  },
  CHAT_BOOST: {
    id: 'CHAT_BOOST',
    title: '💬 SOHBET ŞENLİĞİ: Çifte EkoCoin!',
    desc: 'Önümüzdeki 1 saat boyunca sohbette gönderilen selamlaşma ve mesajlar x2.5 EkoCoin veriyor!',
    multiplier: 2.5,
    category: 'chat',
    durationMinutes: 60
  }
};

/**
 * Aktif etkinliği getir
 */
function getActiveDynamicEvent() {
  if (activeEvent && activeEvent.expiresAt > Date.now()) {
    return activeEvent;
  }
  return null;
}

/**
 * Kategoriye göre aktif etkinlik çarpanını hesaplar
 */
function getEventMultiplier(category) {
  const current = getActiveDynamicEvent();
  if (current && current.category === category) {
    return current.multiplier || 1.0;
  }
  return 1.0;
}

/**
 * Yeni dinamik dünya olayını tetikle
 */
function triggerDynamicEvent(eventId = null, client = null) {
  const keys = Object.keys(EVENT_TYPES);
  const selectedKey = eventId && EVENT_TYPES[eventId] ? eventId : keys[Math.floor(Math.random() * keys.length)];
  const ev = EVENT_TYPES[selectedKey];

  activeEvent = {
    ...ev,
    startedAt: Date.now(),
    expiresAt: Date.now() + (ev.durationMinutes * 60 * 1000)
  };

  console.log(`[dynamicEventManager] Dinamik Dünya Olayı Başlatıldı: ${ev.title}`);

  // Discord kanal duyurusu gönder (client varsa)
  if (client) {
    try {
      const { CHANNELS } = require('./staffAutomation');
      client.channels.fetch(CHANNELS.SEN_DUYURU || CHANNELS.TERFI_LOG).then(chan => {
        if (chan && chan.isTextBased()) {
          const { EmbedBuilder } = require('discord.js');
          const embed = new EmbedBuilder()
            .setColor(0x9b59b6)
            .setTitle(ev.title)
            .setDescription(`${ev.desc}\n\n⏰ **Süre:** ${ev.durationMinutes} Dakika`)
            .setFooter({ text: 'Eko Yıldız • Rastgele Dünya Olayları' })
            .setTimestamp();
          chan.send({ embeds: [embed] }).catch(() => { });
        }
      }).catch(() => { });
    } catch (_) { }
  }

  return activeEvent;
}

/**
 * Gizli Görevler (Easter Eggs) Kontrolü
 */
async function checkEasterEggProgress(progress, actionType, client = null) {
  if (!progress || !progress.gamification) return;
  progress.gamification.badges = progress.gamification.badges || {};

  if (actionType === 'greet_new_members_3' && !progress.gamification.badges.gizemliRehber) {
    progress.gamification.badges.gizemliRehber = true;
    progress.gamification.ecoCoins = (progress.gamification.ecoCoins || 0) + 150;
    progress.gamification.diamonds = (progress.gamification.diamonds || 0) + 50;
    await progress.save().catch(() => { });

    if (client) {
      try {
        const u = await client.users.fetch(progress.userId);
        const { EmbedBuilder } = require('discord.js');
        const embed = new EmbedBuilder()
          .setColor(0xf1c40f)
          .setTitle('🕵️ GİZLİ BAŞARIM AÇILDI: Gizemli Rehber!')
          .setDescription(
            `Gizli bir görevi keşfettiniz! Bugün yeni üyelere harika şekilde rehberlik ettiğiniz için **🕵️ Gizemli Rehber** rozeti, +150 E.C. ve +50 Elmas (💎) kazandınız! 🎉`
          )
          .setFooter({ text: 'Eko Yıldız • Easter Egg Sistem' })
          .setTimestamp();
        await u.send({ embeds: [embed] }).catch(() => { });
      } catch (_) { }
    }
  }
}

module.exports = {
  EVENT_TYPES,
  getActiveDynamicEvent,
  getEventMultiplier,
  triggerDynamicEvent,
  checkEasterEggProgress
};
