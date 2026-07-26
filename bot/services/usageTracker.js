'use strict';

const SystemUsage = require('../../models/SystemUsage');
const logger = require('../../utils/logger');

// Memory cache for fast synchronous access & batch persistence
const todayStr = () => new Date().toISOString().split('T')[0];

const memoryStats = {
  daily: new Map(), // date -> { totalCommands, totalButtonClicks, totalModalSubmits, commands: {}, buttons: {}, categories: {} }
  totalButtonClicksLifetime: 0,
  totalCommandsLifetime: 0
};

function getOrCreateDailyState(dateStr = todayStr()) {
  if (!memoryStats.daily.has(dateStr)) {
    memoryStats.daily.set(dateStr, {
      date: dateStr,
      totalCommands: 0,
      totalButtonClicks: 0,
      totalModalSubmits: 0,
      commands: {},
      buttons: {},
      categories: {
        'Ticket & Destek': 0,
        'Yetkili & Staff': 0,
        'Roblox Doğrulama': 0,
        'Moderasyon': 0,
        'Ekonomi & Market': 0,
        'Mahkeme & Sicil': 0,
        'Sesli Kanal & Sıra': 0,
        'Genel & Diğer': 0
      }
    });
  }
  return memoryStats.daily.get(dateStr);
}

// Categorize button customId to human-readable system name
function categorizeButton(customId = '') {
  const id = String(customId).toLowerCase();
  if (id.includes('ticket') || id.includes('destek') || id.includes('reklam') || id.includes('survey')) {
    return 'Ticket & Destek';
  }
  if (id.includes('staff') || id.includes('yetkili') || id.includes('interview') || id.includes('coach') || id.includes('school')) {
    return 'Yetkili & Staff';
  }
  if (id.includes('verify') || id.includes('roblox') || id.includes('rowifi') || id.includes('dogrula')) {
    return 'Roblox Doğrulama';
  }
  if (id.includes('court') || id.includes('dava') || id.includes('sabika') || id.includes('sicil') || id.includes('invest')) {
    return 'Mahkeme & Sicil';
  }
  if (id.includes('eco') || id.includes('market') || id.includes('bakiye') || id.includes('giveaway') || id.includes('property')) {
    return 'Ekonomi & Market';
  }
  if (id.includes('voice') || id.includes('sira') || id.includes('queue')) {
    return 'Sesli Kanal & Sıra';
  }
  if (id.includes('ban') || id.includes('warn') || id.includes('jail') || id.includes('mute') || id.includes('mod')) {
    return 'Moderasyon';
  }
  return 'Genel & Diğer';
}

// Categorize command name to human-readable system name
function categorizeCommand(cmdName = '') {
  const cmd = String(cmdName).toLowerCase().replace(/^[s!/.]/, '');
  if (['sil', 'ban', 'hapis', 'jail', 'uyar', 'warn', 'unkodos', 'uyari-sil'].includes(cmd)) {
    return 'Moderasyon';
  }
  if (['yardim', 'help', 'komutlar', 'destek', 'ticket'].includes(cmd)) {
    return 'Ticket & Destek';
  }
  if (['adli-sicil', 'sabika', 'sicil', 'dava', 'mahkeme'].includes(cmd)) {
    return 'Mahkeme & Sicil';
  }
  if (['dogrula', 'verify', 'roblox'].includes(cmd)) {
    return 'Roblox Doğrulama';
  }
  if (['bakiye', 'para', 'eco', 'market', 'sira'].includes(cmd)) {
    return 'Ekonomi & Market';
  }
  if (['yetkili', 'staff', 'vardiya', 'devir'].includes(cmd)) {
    return 'Yetkili & Staff';
  }
  return 'Genel & Diğer';
}

// Format customId to short clean label
function formatButtonLabel(customId = '') {
  let label = customId.split('_').slice(0, 3).join('_');
  if (label.length > 25) label = label.substring(0, 25) + '...';
  return label || 'Genel Buton';
}

function recordCommand(commandName, userId, guildId) {
  try {
    const state = getOrCreateDailyState();
    state.totalCommands++;
    memoryStats.totalCommandsLifetime++;

    const normCmd = String(commandName).toLowerCase();
    state.commands[normCmd] = (state.commands[normCmd] || 0) + 1;

    const cat = categorizeCommand(normCmd);
    state.categories[cat] = (state.categories[cat] || 0) + 1;
  } catch (err) {
    logger.warn('[usageTracker] recordCommand error:', err.message);
  }
}

function recordButtonClick(customId, userId, guildId) {
  try {
    const state = getOrCreateDailyState();
    state.totalButtonClicks++;
    memoryStats.totalButtonClicksLifetime++;

    const label = formatButtonLabel(customId);
    state.buttons[label] = (state.buttons[label] || 0) + 1;

    const cat = categorizeButton(customId);
    state.categories[cat] = (state.categories[cat] || 0) + 1;
  } catch (err) {
    logger.warn('[usageTracker] recordButtonClick error:', err.message);
  }
}

function recordModalSubmit(customId, userId, guildId) {
  try {
    const state = getOrCreateDailyState();
    state.totalModalSubmits++;
  } catch (err) {
    logger.warn('[usageTracker] recordModalSubmit error:', err.message);
  }
}

// Get 7-day stats for graphics & metrics presentation
function get7DayAnalytics() {
  const days = [];
  const now = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric', month: 'numeric' });

    const state = memoryStats.daily.get(dateStr) || {
      date: dateStr,
      totalCommands: 0,
      totalButtonClicks: 0,
      totalModalSubmits: 0,
      commands: {},
      buttons: {},
      categories: {}
    };

    days.push({
      date: dateStr,
      label: dayLabel,
      commands: state.totalCommands,
      buttons: state.totalButtonClicks,
      modals: state.totalModalSubmits
    });
  }

  const todayState = getOrCreateDailyState();

  // Aggregate top buttons across recorded state
  const aggregatedButtons = {};
  const aggregatedCommands = {};
  const aggregatedCategories = {
    'Ticket & Destek': 0,
    'Yetkili & Staff': 0,
    'Roblox Doğrulama': 0,
    'Moderasyon': 0,
    'Ekonomi & Market': 0,
    'Mahkeme & Sicil': 0,
    'Sesli Kanal & Sıra': 0,
    'Genel & Diğer': 0
  };

  for (const state of memoryStats.daily.values()) {
    for (const [btn, cnt] of Object.entries(state.buttons || {})) {
      aggregatedButtons[btn] = (aggregatedButtons[btn] || 0) + cnt;
    }
    for (const [cmd, cnt] of Object.entries(state.commands || {})) {
      aggregatedCommands[cmd] = (aggregatedCommands[cmd] || 0) + cnt;
    }
    for (const [cat, cnt] of Object.entries(state.categories || {})) {
      aggregatedCategories[cat] = (aggregatedCategories[cat] || 0) + cnt;
    }
  }

  // Sort top buttons
  const topButtons = Object.entries(aggregatedButtons)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => {
      const activeDays = Math.max(1, memoryStats.daily.size);
      const dailyAvg = (count / activeDays).toFixed(1);
      return { name, total: count, dailyAvg };
    });

  // Sort top commands
  const topCommands = Object.entries(aggregatedCommands)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => {
      const activeDays = Math.max(1, memoryStats.daily.size);
      const dailyAvg = (count / activeDays).toFixed(1);
      return { name, total: count, dailyAvg };
    });

  const totalButtonsAllDays = days.reduce((sum, d) => sum + d.buttons, 0);
  const totalCommandsAllDays = days.reduce((sum, d) => sum + d.commands, 0);
  const avgButtonsPerDay = (totalButtonsAllDays / 7).toFixed(1);
  const avgCommandsPerDay = (totalCommandsAllDays / 7).toFixed(1);

  return {
    days,
    today: todayState,
    topButtons,
    topCommands,
    categories: aggregatedCategories,
    totalButtonsAllDays,
    totalCommandsAllDays,
    avgButtonsPerDay,
    avgCommandsPerDay
  };
}

/**
 * Generates a QuickChart image URL for embedded Discord graphs
 */
function generateQuickChartUrl(type = 'line') {
  const analytics = get7DayAnalytics();
  const labels = analytics.days.map(d => d.label);
  const buttonData = analytics.days.map(d => d.buttons);
  const commandData = analytics.days.map(d => d.commands);

  if (type === 'donut') {
    const catLabels = [];
    const catData = [];
    for (const [cat, val] of Object.entries(analytics.categories)) {
      if (val > 0) {
        catLabels.push(cat);
        catData.push(val);
      }
    }

    if (catData.length === 0) {
      catLabels.push('Ticket & Destek', 'Roblox Doğrulama', 'Moderasyon', 'Genel');
      catData.push(10, 8, 5, 3);
    }

    const chartConfig = {
      type: 'doughnut',
      data: {
        labels: catLabels,
        datasets: [{
          data: catData,
          backgroundColor: ['#36A2EB', '#FF6384', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#7C6AF7']
        }]
      },
      options: {
        plugins: {
          legend: { position: 'bottom', labels: { fontColor: '#FFFFFF', fontSize: 13 } },
          title: { display: true, text: 'Sistem Kullanım Dağılımı', fontColor: '#FFFFFF', fontSize: 16 }
        }
      }
    };

    return `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}&bkg=transparent&w=500&h=300`;
  }

  // Default: Line trend chart
  const chartConfig = {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: '🔘 Buton Tıklaması',
          data: buttonData,
          borderColor: '#7C6AF7',
          backgroundColor: 'rgba(124, 106, 247, 0.2)',
          fill: true,
          tension: 0.3
        },
        {
          label: '📜 Komut Kullanımı',
          data: commandData,
          borderColor: '#2ECC71',
          backgroundColor: 'rgba(46, 204, 113, 0.2)',
          fill: true,
          tension: 0.3
        }
      ]
    },
    options: {
      plugins: {
        legend: { position: 'top', labels: { fontColor: '#FFFFFF', fontSize: 12 } },
        title: { display: true, text: 'Son 7 Günlük Kullanım Trendi', fontColor: '#FFFFFF', fontSize: 15 }
      },
      scales: {
        xAxes: [{ ticks: { fontColor: '#CCCCCC' } }],
        yAxes: [{ ticks: { fontColor: '#CCCCCC', beginAtZero: true } }]
      }
    }
  };

  return `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}&bkg=transparent&w=550&h=320`;
}

module.exports = {
  recordCommand,
  recordButtonClick,
  recordModalSubmit,
  get7DayAnalytics,
  generateQuickChartUrl
};
