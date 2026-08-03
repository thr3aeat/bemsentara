'use strict';

const StaffProgress = require('../../models/StaffProgress');

// Sanal Şehir Mülk Kataloğu
const REAL_ESTATE_PROPERTIES = {
  coffee_shop: {
    id: 'coffee_shop',
    name: '☕ Moderatör Kahve Dükkanı',
    price: 300, // EkoCoin
    hourlyIncome: 10, // Saatlik EkoCoin
    desc: 'Personel için kahve molası yeri. Saatlik +10 E.C. pasif gelir üretir.'
  },
  tactic_office: {
    id: 'tactic_office',
    name: '💼 Taktik Operasyon Ofisi',
    price: 800,
    hourlyIncome: 30,
    desc: 'Operasyon takip merkezi. Saatlik +30 E.C. pasif gelir üretir.'
  },
  penthouse: {
    id: 'penthouse',
    name: '🏙️ Şehir Manzaralı Penthouse',
    price: 2000,
    hourlyIncome: 85,
    desc: 'Lüks şehir rezidansı. Saatlik +85 E.C. pasif gelir üretir.'
  },
  holding: {
    id: 'holding',
    name: '🏛️ Eko Yıldız Sanal Holding',
    price: 5000,
    hourlyIncome: 250,
    desc: 'Sanal şehir dev şirketi. Saatlik +250 E.C. devasa pasif gelir üretir.'
  }
};

/**
 * Mülk Satın Al
 */
async function buyProperty(userId, propertyId) {
  const prop = REAL_ESTATE_PROPERTIES[propertyId];
  if (!prop) return { success: false, message: 'Geçersiz mülk seçimi.' };

  const p = await StaffProgress.findOne({ userId });
  if (!p) return { success: false, message: 'Personel kaydı bulunamadı.' };

  p.gamification = p.gamification || {};
  const coins = p.gamification.ecoCoins || 0;
  if (coins < prop.price) {
    return { success: false, message: `Yetersiz bakiyeniz var! Gerekli: ${prop.price} E.C., Sizde Olan: ${coins} E.C.` };
  }

  p.portfolio = p.portfolio || [];
  p.portfolio.push({
    propertyId: prop.id,
    purchasedAt: new Date(),
    purchasePrice: prop.price
  });

  p.gamification.ecoCoins -= prop.price;
  await p.save();

  return { success: true, propertyName: prop.name, newBalance: p.gamification.ecoCoins };
}

/**
 * Tüm mülklerden pasif gelir aktarımı (Saatlik veya Günlük kontrol)
 */
async function processPassiveIncome(p) {
  if (!p || !p.portfolio || p.portfolio.length === 0) return 0;

  let totalHourlyIncome = 0;
  for (const item of p.portfolio) {
    const prop = REAL_ESTATE_PROPERTIES[item.propertyId];
    if (prop) {
      totalHourlyIncome += prop.hourlyIncome;
    }
  }

  if (totalHourlyIncome > 0) {
    p.daily = p.daily || {};
    const MAX_DAILY_ESTATE_INCOME = 500;
    const currentEstateIncome = p.daily.estateIncomeToday || 0;

    if (currentEstateIncome >= MAX_DAILY_ESTATE_INCOME) {
      return 0; // Günlük 500 E.C. tavan sınırına ulaşıldı
    }

    const allowableIncome = Math.min(totalHourlyIncome, MAX_DAILY_ESTATE_INCOME - currentEstateIncome);
    p.daily.estateIncomeToday = currentEstateIncome + allowableIncome;

    p.savingsFund = (p.savingsFund || 0) + allowableIncome;
    p.gamification = p.gamification || {};
    p.gamification.ecoCoins = (p.gamification.ecoCoins || 0) + allowableIncome;
    return allowableIncome;
  }
  return 0;
}

/**
 * $EKO Index Borsası (Borsa Endeksi)
 * Sunucudaki aktiflik durumuna göre dinamik oran üretir
 */
function getMarketIndex() {
  const now = new Date();
  const hour = now.getHours();
  // 12:00 - 23:00 arası piyasa canlı (Boğa)
  const isBull = hour >= 12 && hour <= 23;
  const baseValue = isBull ? 120 + (Math.sin(hour) * 15) : 85 + (Math.cos(hour) * 10);
  const trend = isBull ? '📈 Yükselişte (Boğa Piyasası)' : '📉 Düşüşte (Ayı Piyasası)';
  return {
    value: parseFloat(baseValue.toFixed(2)),
    trend,
    isBull
  };
}

/**
 * Borsaya Yatırım Yap (Hisse Al)
 */
async function investInStock(userId, amount) {
  if (!amount || amount <= 0) return { success: false, message: 'Geçerli bir yatırım miktarı giriniz.' };

  const p = await StaffProgress.findOne({ userId });
  if (!p) return { success: false, message: 'Personel kaydı bulunamadı.' };

  p.gamification = p.gamification || {};
  if ((p.gamification.ecoCoins || 0) < amount) {
    return { success: false, message: 'Yetersiz EkoCoin bakiyesi!' };
  }

  const market = getMarketIndex();
  // Boğa piyasasında %70 şansla kazanç, Ayı piyasasında %40 şansla kazanç
  const winChance = market.isBull ? 0.70 : 0.40;
  const isWin = Math.random() < winChance;

  let netChange = 0;
  let insuranceGranted = false;

  if (isWin) {
    const profitRate = 0.20 + (Math.random() * 0.30); // %20 ile %50 arası kâr
    netChange = Math.round(amount * profitRate);
    p.gamification.ecoCoins += netChange;
  } else {
    const lossRate = 0.15 + (Math.random() * 0.25); // %15 ile %40 arası zarar
    netChange = -Math.round(amount * lossRate);
    p.gamification.ecoCoins = Math.max(0, p.gamification.ecoCoins + netChange);

    // 🛡️ Borsa Sigortası / Mola Tesellisi Mekanizması:
    // Personel para kaybettiğinde motivasyonu kırılmasın diye +1 İzin Kredisi ve +50 Elmas teselli verilir
    p.stats = p.stats || {};
    p.stats.breakCredits = (p.stats.breakCredits || 0) + 1;
    p.gamification.diamonds = (p.gamification.diamonds || 0) + 50;
    insuranceGranted = true;
  }

  await p.save();

  return {
    success: true,
    isWin,
    netChange,
    newBalance: p.gamification.ecoCoins,
    marketTrend: market.trend,
    insuranceGranted
  };
}

module.exports = {
  REAL_ESTATE_PROPERTIES,
  buyProperty,
  processPassiveIncome,
  getMarketIndex,
  investInStock
};
