const { collections } = require("./Store");
const modPerformances = collections.modPerformances;

const ModPerformance = {
  findOne(query) {
    return Promise.resolve(modPerformances.findOne(query));
  },
  find(query) {
    return Promise.resolve(modPerformances.find(query));
  },
  create(data) {
    const defaults = {
      points: 0.0,
      actionsCount: 0,
      ticketsClosedCount: 0,
      lastActionTimestamp: null,
      modLogs: [],
      createdAt: new Date(),
    };
    return Promise.resolve(modPerformances.create({ ...defaults, ...data }));
  }
};

function ModPerformanceConstructor(data) {
  const defaults = {
    points: 0.0,
    actionsCount: 0,
    ticketsClosedCount: 0,
    lastActionTimestamp: null,
    modLogs: [],
    createdAt: new Date(),
  };
  const merged = { ...defaults, ...data };
  merged.save = function () {
    if (merged._id && modPerformances.data.has(merged._id)) {
      merged.updatedAt = new Date();
      const stored = { ...merged };
      delete stored.save;
      modPerformances.data.set(merged._id, stored);
      modPerformances.persist();
      return Promise.resolve(merged);
    }
    const created = modPerformances.create(merged);
    Object.assign(merged, created);
    return Promise.resolve(merged);
  };
  return merged;
}

ModPerformanceConstructor.findOne = ModPerformance.findOne;
ModPerformanceConstructor.find = ModPerformance.find;
ModPerformanceConstructor.create = ModPerformance.create;

module.exports = ModPerformanceConstructor;
