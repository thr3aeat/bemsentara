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
