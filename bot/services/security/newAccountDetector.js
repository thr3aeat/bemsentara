/**
 * newAccountDetector.js
 * 
 * 24 saat içinde oluşturulan hesapları tespit eder ve risk puanı hesaplar
 */

const { EmbedBuilder } = require("discord.js");

/**
 * Hesabın 24 saat içinde oluşturulup oluşturulmadığını kontrol eder
 * @param {GuildMember} member 
 * @returns {boolean}
 */
function isNewAccount(member) {
  const accountCreatedAt = member.user.createdTimestamp;
  const now = Date.now();
  const hours24 = 24 * 60 * 60 * 1000;
  
  return (now - accountCreatedAt) < hours24;
}

/**
 * Hesabın yaşını saat cinsinden döndürür
 * @param {User} user 
 * @returns {number}
 */
function getAccountAgeInHours(user) {
  const accountCreatedAt = user.createdTimestamp;
  const now = Date.now();
  return Math.floor((now - accountCreatedAt) / (1000 * 60 * 60));
}

/**
 * Hesap için risk puanı hesaplar (0-100)
 * @param {GuildMember} member 
 * @returns {Promise<number>}
 */
async function calculateRiskScore(member) {
  let score = 0;
  
  // 1. Hesap yaşı (maksimum 40 puan)
  const ageHours = getAccountAgeInHours(member.user);
  if (ageHours < 1) score += 40;
  else if (ageHours < 6) score += 30;
  else if (ageHours < 12) score += 20;
  else if (ageHours < 24) score += 10;
  
  // 2. Profil resmi yok (15 puan)
  if (!member.user.avatar || member.user.avatar === member.user.defaultAvatarURL) {
    score += 15;
  }
  
  // 3. Kullanıcı adı şüpheli (20 puan)
  const username = member.user.username.toLowerCase();
  const suspiciousPatterns = [
    /^user\d+$/,           // user123
    /^discord\d+$/,        // discord456
    /^alt\d*/,             // alt, alt1, alt2
    /^backup/,             // backup account
    /^test/,               // test account
    /(.)\1{3,}/,           // aaa veya 111 gibi tekrarlar
    /^[a-z]{1,3}\d{4,}$/,  // a1234, xy9999 gibi
  ];
  
  if (suspiciousPatterns.some(pattern => pattern.test(username))) {
    score += 20;
  }
  
  // 4. Ortak sunucu sayısı az (15 puan)
  try {
    const mutualGuilds = member.client.guilds.cache.filter(g => 
      g.members.cache.has(member.id)
    );
    
    if (mutualGuilds.size <= 1) score += 15;
    else if (mutualGuilds.size <= 3) score += 10;
    else if (mutualGuilds.size <= 5) score += 5;
  } catch (err) {
    console.warn("[RiskScore] Mutual guild check failed:", err.message);
  }
  
  // 5. Bio/Hakkımda yok (10 puan)
  try {
    const userProfile = await member.user.fetch(true).catch(() => null);
    if (userProfile && !userProfile.bio) {
      score += 10;
    }
  } catch (err) {
    // Bio erişilemiyorsa pas geç
  }
  
  return Math.min(score, 100);
}

/**
 * Risk seviyesini renge çevirir
 * @param {number} score 
 * @returns {number} Hex color
 */
function getRiskColor(score) {
  if (score >= 70) return 0xFF0000; // Kırmızı - Yüksek risk
  if (score >= 40) return 0xFFA500; // Turuncu - Orta risk
  return 0xFFFF00; // Sarı - Düşük risk
}

/**
 * Risk seviyesi metni
 * @param {number} score 
 * @returns {string}
 */
function getRiskLevel(score) {
  if (score >= 70) return "🔴 Yüksek Risk";
  if (score >= 40) return "🟠 Orta Risk";
  return "🟡 Düşük Risk";
}

module.exports = {
  isNewAccount,
  getAccountAgeInHours,
  calculateRiskScore,
  getRiskColor,
  getRiskLevel,
};
