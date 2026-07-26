'use strict';

/**
 * AccountRiskScore — Evaluates new user accounts entering the server for alt account / raid risk (0 - 100 risk score).
 */
function calculateAccountRisk(user) {
  if (!user) return { riskScore: 0, flags: [] };

  let riskScore = 0;
  const flags = [];

  const createdTimestamp = user.createdTimestamp || Date.now();
  const accountAgeDays = (Date.now() - createdTimestamp) / (1000 * 60 * 60 * 24);

  // 1. Account Age Risk
  if (accountAgeDays < 1) {
    riskScore += 50;
    flags.push('Süper Yeni Hesap (< 24 Saat)');
  } else if (accountAgeDays < 7) {
    riskScore += 30;
    flags.push('Yeni Hesap (< 7 Gün)');
  } else if (accountAgeDays < 30) {
    riskScore += 15;
    flags.push('Taze Hesap (< 1 Ay)');
  }

  // 2. Avatar Check
  if (!user.avatar && !user.avatarURL) {
    riskScore += 20;
    flags.push('Varsayılan Profil Resmi (No Avatar)');
  }

  // 3. Username pattern check (suspicious random strings or bot patterns)
  const username = user.username || '';
  if (/^[a-z0-9]{12,}$/i.test(username) || /^user_\d+$/i.test(username)) {
    riskScore += 15;
    flags.push('Rastgele/Şüpheli Kullanıcı Adı Deseni');
  }

  // Cap risk score between 0 and 100
  riskScore = Math.min(100, riskScore);

  let riskLevel = 'Düşük Risk';
  if (riskScore >= 70) riskLevel = 'Yüksek Risk / Karantina';
  else if (riskScore >= 40) riskLevel = 'Orta Risk';

  return {
    riskScore,
    riskLevel,
    flags,
    accountAgeDays: Math.floor(accountAgeDays)
  };
}

module.exports = {
  calculateAccountRisk
};
