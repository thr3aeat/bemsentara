let centralBankOverride = {
  active: false,
  crisisTaxRate: null,
  multiplier: null,
  expiresAt: null
};

function applyCentralBankIntervention(crisisTaxRate = 0.05, multiplier = 2.0, durationHours = 24) {
  centralBankOverride = {
    active: true,
    crisisTaxRate: Number(crisisTaxRate),
    multiplier: Number(multiplier),
    expiresAt: Date.now() + durationHours * 60 * 60 * 1000
  };
  return centralBankOverride;
}

function getCentralBankState() {
  if (centralBankOverride.active && Date.now() >= centralBankOverride.expiresAt) {
    centralBankOverride.active = false;
  }
  return centralBankOverride;
}

function getMarketSnapshot(metrics = {}) {
  const pendingTickets = Number(metrics.pendingTickets || 0);
  const warnings = Number(metrics.warnings || 0);
  const chatMessages = Number(metrics.chatMessages || 0);
  const activeStaff = Number(metrics.activeStaff || 0);

  const riskScore = pendingTickets * 2 + warnings * 3 + Math.max(0, 80 - chatMessages) * 0.1 + Math.max(0, 6 - activeStaff) * 2;

  let snapshot;
  if (riskScore >= 24) {
    snapshot = {
      state: 'Piyasa Çöktü',
      multiplier: 0.5,
      diamondRate: 35,
      interestRate: 0,
      crisisTaxRate: 0.15,
      riskScore,
      trend: '▃ ▅ ▂ ▄'
    };
  } else if (riskScore >= 10) {
    snapshot = {
      state: 'Ayı Piyasası',
      multiplier: 1.2,
      diamondRate: 18,
      interestRate: 8,
      crisisTaxRate: 0.12,
      riskScore,
      trend: '▃ ▄ ▂'
    };
  } else {
    snapshot = {
      state: 'Boğa Piyasası',
      multiplier: 2.5,
      diamondRate: 8,
      interestRate: 14,
      crisisTaxRate: 0.1,
      riskScore,
      trend: '▃ ▅ █ █ ▄'
    };
  }

  const cbState = getCentralBankState();
  if (cbState.active) {
    if (cbState.crisisTaxRate !== null) snapshot.crisisTaxRate = cbState.crisisTaxRate;
    if (cbState.multiplier !== null) snapshot.multiplier = cbState.multiplier;
    snapshot.centralBankIntervention = true;
  }

  return snapshot;
}

function calculateSalaryBreakdown(weeklyStats = {}, metrics = {}) {
  const snapshot = getMarketSnapshot(metrics);
  const voiceMinutes = Number(weeklyStats.voiceMinutes || 0);
  const ticketsSolved = Number(weeklyStats.ticketsSolved || 0);
  const moderationActions = Number(weeklyStats.moderationActions || 0);

  const baseVoice = Math.floor(voiceMinutes * 1.4);
  const baseTickets = Math.floor(ticketsSolved * 85);
  const baseMod = Math.floor(moderationActions * 60);
  const gross = Math.floor((baseVoice + baseTickets + baseMod) * snapshot.multiplier);
  const taxDeduction = Math.floor(gross * snapshot.crisisTaxRate);
  const net = Math.max(0, gross - taxDeduction);

  return {
    gross,
    taxDeduction,
    net,
    snapshot,
    currencyRate: snapshot.diamondRate
  };
}

module.exports = {
  getMarketSnapshot,
  calculateSalaryBreakdown,
  applyCentralBankIntervention,
  getCentralBankState
};
