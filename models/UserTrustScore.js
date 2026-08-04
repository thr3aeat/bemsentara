const { collections } = require("./Store");
const userTrustScores = collections.userTrustScores;

const UserTrustScore = {
  findOne(query) {
    return Promise.resolve(userTrustScores.findOne(query));
  },
  find(query) {
    return Promise.resolve(userTrustScores.find(query));
  },
  create(data) {
    const defaults = {
      trustScore: 100.0,
      scoreLogs: [],
      dailyChatPoints: 0.0,
      dailyVoicePoints: 0.0,
      lastPointsResetDate: new Date().toISOString().split('T')[0],
      messageCount: 0,
      lastMessageTimestamp: null,
      
      // New specifications
      dailyStreak: 0,
      lastMessageDate: null,
      streakLastBonusDate: null,
      helpedUsersCount: 0,
      forumSharesCount: 0,
      bugReportsCount: 0,
      weeklyDecayLastChecked: null,
      lastActiveTimestamp: new Date(),
      bonus2FA: false,
      bonusPhone: false,
      bonusAccountAge: 0, // 0, 5, 10
      bonusJoinAge: 0, // 0, 5, 15
      capsViolationsCount: 0,
      lastCapsViolationReset: new Date().toISOString().split('T')[0],
      afProgress: {
        active: false,
        daysCompleted: 0,
        messagesToday: 0,
        lastMessageDay: null,
        lastPenaltyDate: null
      },
      
      profileChannelId: null,
      profileMessageId: null,
      createdAt: new Date(),
    };
    return Promise.resolve(userTrustScores.create({ ...defaults, ...data }));
  }
};

function UserTrustScoreConstructor(data) {
  const defaults = {
    trustScore: 100.0,
    scoreLogs: [],
    dailyChatPoints: 0.0,
    dailyVoicePoints: 0.0,
    lastPointsResetDate: new Date().toISOString().split('T')[0],
    messageCount: 0,
    lastMessageTimestamp: null,
    
    // New specifications
    dailyStreak: 0,
    lastMessageDate: null,
    streakLastBonusDate: null,
    helpedUsersCount: 0,
    forumSharesCount: 0,
    bugReportsCount: 0,
    weeklyDecayLastChecked: null,
    lastActiveTimestamp: new Date(),
    bonus2FA: false,
    bonusPhone: false,
    bonusAccountAge: 0,
    bonusJoinAge: 0,
    capsViolationsCount: 0,
    lastCapsViolationReset: new Date().toISOString().split('T')[0],
    afProgress: {
      active: false,
      daysCompleted: 0,
      messagesToday: 0,
      lastMessageDay: null,
      lastPenaltyDate: null
    },
    
    profileChannelId: null,
    profileMessageId: null,
    createdAt: new Date(),
  };
  const merged = { ...defaults, ...data };
  merged.save = function () {
    if (merged._id && userTrustScores.data.has(merged._id)) {
      merged.updatedAt = new Date();
      const stored = { ...merged };
      delete stored.save;
      userTrustScores.data.set(merged._id, stored);
      userTrustScores.persist();
      return Promise.resolve(merged);
    }
    const created = userTrustScores.create(merged);
    Object.assign(merged, created);
    return Promise.resolve(merged);
  };
  return merged;
}

UserTrustScoreConstructor.findOne = UserTrustScore.findOne;
UserTrustScoreConstructor.find = UserTrustScore.find;
UserTrustScoreConstructor.create = UserTrustScore.create;

module.exports = UserTrustScoreConstructor;
