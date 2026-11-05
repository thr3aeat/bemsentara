const { 
  TMT_GUILD_ID, 
  TMT_HONEYPOT_CHANNEL_ID,
  TMT_OWO_CHANNEL_ID,
  TMT_TUTTU_CHANNEL_ID,
  TMT_BOM_CHANNEL_ID,
  TMT_WORDGAME_CHANNEL_ID
} = require("../../config");

// --- In-Memory States for Games ---

// Bom Game State
let currentBomNumber = null; // null = henüz senkronize edilmedi
let lastBomUser = null;
let bomSyncPromise = null;

// Word Game State
let lastWordLetter = null;
let lastWordUser = null;
const usedWords = new Set();
let wordSyncPromise = null;

// Kelime oyunu puan tablosu (userId -> puan)
const wordGameScores = new Map();

/**
 * Türkçe'de hiçbir kelime bu harflerle başlamaz — çıkmaz harfler.
 * Oyuncu bu harfle biten kelime yazarsa +10 puan kazanır ve
 * sistem rastgele güvenli bir harf seçerek oyunu sürdürür.
 */
const CIKMAZHARF = new Set(['ğ']);

/** Güvenli başlangıç harfleri (çıkmaz olmayan yaygın harfler) */
const GUVENLI_HARFLER = ['a','b','c','d','e','f','g','h','i','k','l','m','n','o','p','r','s','t','u','v','y','z'];

function rastgeleGuvenliHarf() {
  return GUVENLI_HARFLER[Math.floor(Math.random() * GUVENLI_HARFLER.length)];
}

/** Türkçe'ye uygun küçük harf (İ→i, I→ı). Mobil klavyeler ilk harfi büyük yazar. */
function trLower(str) {
  return String(str || "").toLocaleLowerCase("tr-TR");
}

/** Mesajdaki ilk kelimeyi Türkçe küçük harfe çevirip döndürür (noktalama sondan temizlenir). */
function firstWord(content) {
  return trLower(String(content || "").trim().split(/\s+/)[0]).replace(/[.,!?;:…]+$/u, "");
}

const WORD_REGEX = /^[a-zçğıöşüâîû]+$/;

async function sendTemp(channel, content, ms) {
  const reply = await channel.send({ content, allowedMentions: { users: [] } }).catch(() => null);
  if (reply) setTimeout(() => reply.delete().catch(() => {}), ms);
}

function addWordScore(userId, puan) {
  wordGameScores.set(userId, (wordGameScores.get(userId) || 0) + puan);
  return wordGameScores.get(userId);
}

function getWordScore(userId) {
  return wordGameScores.get(userId) || 0;
}

/**
 * Bom oyununu kanal geçmişinden senkronize et.
 * Son mesajlara bakarak currentBomNumber'ı belirle.
 */
function syncBomFromHistory(channel, currentMsgId) {
  // Senkron bitmeden gelen diğer mesajlar da aynı promise'i bekler
  // (önceden currentBomNumber null iken kontrol edilip hatalı siliniyordu)
  if (!bomSyncPromise) bomSyncPromise = doSyncBom(channel, currentMsgId);
  return bomSyncPromise;
}

async function doSyncBom(channel, currentMsgId) {
  try {
    // Son 50 mesajı çek (bot mesajları dahil)
    const messages = await channel.messages.fetch({ limit: 50 });
    // Kronolojik sırayla (eskiden yeniye)
    const sorted = [...messages.values()]
      .filter(m => m.id !== currentMsgId)
      .sort((a, b) => a.createdTimestamp - b.createdTimestamp);

    let foundNumber = 0;
    let foundUser = null;

    // En yeniden eskiye doğru tara, ilk geçerli sayı veya "bom" mesajını bul
    for (let i = sorted.length - 1; i >= 0; i--) {
      const msg = sorted[i];
      if (msg.author.bot) continue;

      const content = msg.content.trim().toLowerCase();

      // Sayı mı kontrol et
      const num = parseInt(content, 10);
      if (!isNaN(num) && num > 0 && num.toString() === content) {
        foundNumber = num;
        foundUser = msg.author.id;
        break;
      }

      // "bom" yazılmışsa, o mesajdan önceki sayıyı bulmamız gerekiyor
      if (content.includes("bom")) {
        // Bu "bom" mesajından önceki sayıyı bul
        for (let j = i - 1; j >= 0; j--) {
          const prevMsg = sorted[j];
          if (prevMsg.author.bot) continue;
          const prevNum = parseInt(prevMsg.content.trim(), 10);
          if (!isNaN(prevNum) && prevNum > 0) {
            foundNumber = prevNum + 1; // bom'dan sonraki sayı = prevNum + 1
            foundUser = msg.author.id;
            break;
          }
        }
        if (foundNumber > 0) break;
      }
    }

    if (foundNumber > 0) {
      currentBomNumber = foundNumber + 1; // Bir sonraki sayı
      lastBomUser = foundUser;
      console.log(`[tmtGames] Bom senkronize edildi: son sayı=${foundNumber}, sıradaki=${currentBomNumber}`);
    } else {
      currentBomNumber = 1;
      lastBomUser = null;
      console.log('[tmtGames] Bom geçmişi boş, 1\'den başlıyor');
    }
  } catch (err) {
    console.error('[tmtGames] Bom senkronizasyon hatası:', err.message);
    if (currentBomNumber === null) currentBomNumber = 1;
  }
}

/**
 * Kelime oyununu kanal geçmişinden senkronize et.
 * Son mesajlara bakarak lastWordLetter ve usedWords'ü belirle.
 */
function syncWordFromHistory(channel, currentMsgId) {
  if (!wordSyncPromise) wordSyncPromise = doSyncWord(channel, currentMsgId);
  return wordSyncPromise;
}

async function doSyncWord(channel, currentMsgId) {
  try {
    const messages = await channel.messages.fetch({ limit: 50 });
    const sorted = [...messages.values()]
      .filter(m => m.id !== currentMsgId)
      .sort((a, b) => a.createdTimestamp - b.createdTimestamp);

    for (const msg of sorted) {
      if (msg.author.bot) continue;
      const word = firstWord(msg.content);
      if (!WORD_REGEX.test(word)) continue;

      usedWords.add(word);
      lastWordLetter = CIKMAZHARF.has(word.slice(-1)) ? lastWordLetter : word.slice(-1);
      lastWordUser = msg.author.id;
    }

    if (lastWordLetter) {
      console.log(`[tmtGames] Kelime oyunu senkronize edildi: son harf="${lastWordLetter}", ${usedWords.size} kelime hafızada`);
    } else {
      console.log('[tmtGames] Kelime oyunu geçmişi boş, sıfırdan başlıyor');
    }
  } catch (err) {
    console.error('[tmtGames] Kelime oyunu senkronizasyon hatası:', err.message);
  }
}

/**
 * Handle incoming messages for TMT specific channels (games & honeypot).
 * Returns true if the message was handled by a game/honeypot.
 */
async function handleTMTGames(message, client) {
  // Sadece TMT sunucusundaki mesajlar
  if (!message.guild || message.guild.id !== TMT_GUILD_ID) return false;
  if (message.author.bot) return false; // Botların mesajlarına tepki verme

  const channelId = message.channel.id;

  // 1. Honeypot (Tuzak Kanalı)
  if (channelId === TMT_HONEYPOT_CHANNEL_ID) {
    if (require('./profanityAutomodService').isProtectedUser(message.author.id)) return true;
    try {
      // Mesajı sil
      await message.delete().catch(() => {});

      // Kick'lemeden önce itiraz DM'i gönder (kick sonrası DM gönderilemeyebilir)
      try {
        const { sendAppealDM } = require('./banAppeal');
        await sendAppealDM(
          message.author,
          message.guild.name,
          message.guild.id,
          'Honeypot (Tuzak) kanalına mesaj gönderdi.',
          'honeypot'
        );
      } catch (_) {}

      // Kullanıcıyı sunucudan at
      if (message.member && message.member.kickable) {
        await message.member.kick("Honeypot (Tuzak) kanalına mesaj gönderdi.");
      }
    } catch (err) {
      console.error("[Honeypot] Kick error:", err.message);
    }
    return true;
  }

  // 2. OwO Game
  if (channelId === TMT_OWO_CHANNEL_ID) {
    const owoFaces = ["(・`ω´・)", ";;w;;", "owo", "UwU", ">w<", "^w^", "úwú"];
    const randomFace = () => owoFaces[Math.floor(Math.random() * owoFaces.length)];
    
    let text = message.content;
    text = text.replace(/(?:r|l)/g, "w");
    text = text.replace(/(?:R|L)/g, "W");
    text = text.replace(/n([aeiou])/g, "ny$1");
    text = text.replace(/N([aeiou])/g, "Ny$1");
    text = text.replace(/N([AEIOU])/g, "Ny$1");
    text = text.replace(/ove/g, "uv");
    
    const replyText = `${text} ${randomFace()}`;
    // Kullanıcının yazdığını tekrar ettiğimiz için @everyone/@rol pinglerini engelle
    await message.reply({ content: replyText.slice(0, 2000), allowedMentions: { parse: [], repliedUser: false } }).catch(() => {});
    return true;
  }

  // 3. Tuttu/Tutmadı Game
  if (channelId === TMT_TUTTU_CHANNEL_ID) {
    const lowerContent = message.content.toLowerCase();
    if (lowerContent.includes("tuttu") || lowerContent.includes("tutmadı") || lowerContent.includes("tutmadi")) {
      await message.react("✅").catch(() => {});
    } else {
      await message.delete().catch(() => {});
    }
    return true;
  }

  // 4. Bom Game
  if (channelId === TMT_BOM_CHANNEL_ID) {
    // İlk mesajda kanal geçmişinden senkronize et
    await syncBomFromHistory(message.channel, message.id);

    const content = trLower(message.content).trim();

    // Aynı kişi üst üste yazamaz
    if (message.author.id === lastBomUser) {
      await message.delete().catch(() => {});
      await sendTemp(message.channel, `<@${message.author.id}>, aynı kişi üst üste oynayamaz! Sıranı bekle.`, 3000);
      return true;
    }

    const expectedNumber = currentBomNumber;
    const isMultipleOfFive = expectedNumber % 5 === 0;
    const isCorrect = isMultipleOfFive
      ? content.includes("bom")
      : content === expectedNumber.toString();

    if (isCorrect) {
      // Durumu await'ten ÖNCE güncelle; aynı anda gelen iki doğru mesaj ikisi de kabul edilmesin
      currentBomNumber++;
      lastBomUser = message.author.id;
      await message.react("✅").catch(() => {});
    } else {
      await message.delete().catch(() => {});
      const expected = isMultipleOfFive ? "bom" : expectedNumber;
      await sendTemp(message.channel, `<@${message.author.id}>, hatalı giriş! **${expected}** demen gerekiyordu. Oyun kaldığı yerden devam ediyor.`, 4000);
      // Datayı kaybetmemek için sıfırlamıyoruz
    }
    return true;
  }

  // 5. Kelime Oyunu
  if (channelId === TMT_WORDGAME_CHANNEL_ID) {
    // İlk mesajda kanal geçmişinden senkronize et
    await syncWordFromHistory(message.channel, message.id);

    // Aynı kişi üst üste oynayamaz
    if (message.author.id === lastWordUser) {
      await message.delete().catch(() => {});
      await sendTemp(message.channel, `<@${message.author.id}>, aynı kişi üst üste oynayamaz! Sıranı bekle.`, 3000);
      return true;
    }

    const word = firstWord(message.content);

    // Sadece harflerden oluşan bir kelime olmalı (boş mesaj, sayı, emoji vb. kabul edilmez)
    if (!WORD_REGEX.test(word)) {
      await message.delete().catch(() => {});
      await sendTemp(message.channel, `<@${message.author.id}>, sadece harflerden oluşan tek bir kelime yazmalısın.`, 3000);
      return true;
    }

    if (lastWordLetter && !word.startsWith(lastWordLetter)) {
      await message.delete().catch(() => {});
      await sendTemp(message.channel, `<@${message.author.id}>, kelime **"${lastWordLetter.toLocaleUpperCase("tr-TR")}"** harfi ile başlamalı!`, 3000);
      return true;
    }

    if (usedWords.has(word)) {
      await message.delete().catch(() => {});
      await sendTemp(message.channel, `<@${message.author.id}>, "${word}" kelimesi daha önce kullanıldı! Lütfen başka kelime bulun.`, 3000);
      return true;
    }

    // Durumu await'ten önce güncelle (yarış durumunu önler)
    const sonHarf = word.slice(-1);
    lastWordUser = message.author.id;
    usedWords.add(word);
    const cikmaz = CIKMAZHARF.has(sonHarf);
    const yeniHarf = cikmaz ? rastgeleGuvenliHarf() : sonHarf;
    lastWordLetter = yeniHarf;

    await message.react("✅").catch(() => {});

    if (cikmaz) {
      const yeniPuan = addWordScore(message.author.id, 10);
      const { EmbedBuilder } = require('discord.js');
      const embed = new EmbedBuilder()
        .setTitle('🔤 Çıkmaz Harf')
        .setColor(0xf59e0b)
        .setDescription(
          `<@${message.author.id}> çıkmaza sokan harf yazdığın için **10 oyun puanı** aldın!\n` +
          `Girilen kelime **${word}** oyuncu çıkmaza sokan bir harf olan **${sonHarf}** ile bitiyor.\n` +
          `Oyunun çıkmaza girmemesi için sistem tarafından rastgele bir harf seçildi.\n\n` +
          `**Oyunun yeni harfi: ${yeniHarf.toLocaleUpperCase("tr-TR")}**`
        )
        .setFooter({ text: `Toplam puanın: ${yeniPuan}` })
        .setTimestamp();
      await message.channel.send({ embeds: [embed] }).catch(() => {});
    }
    return true;
  }

  return false;
}

module.exports = {
  handleTMTGames,
  getWordScore,
  wordGameScores
};
