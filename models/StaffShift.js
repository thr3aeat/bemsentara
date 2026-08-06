const { collections } = require("./Store");
const staffShifts = collections.staffShifts;

/**
 * Personel Canlı Vardiya Kayıt Modeli
 */
const StaffShift = {
  findOne(query) {
    return Promise.resolve(staffShifts.findOne(query));
  },
  find(query) {
    return Promise.resolve(staffShifts.find(query));
  },
  create(data) {
    const defaults = {
      userId: "",
      guildId: "",
      shiftType: "GENERAL", // GENERAL, VOICE, CHAT, NIGHT
      startedAt: new Date(),
      endedAt: null,
      durationMinutes: 0,
      status: "ACTIVE", // ACTIVE, COMPLETED, CANCELLED
      ticketsHandled: 0,
      moderationsHandled: 0,
      messagesSent: 0,
      createdAt: new Date(),
    };
    return Promise.resolve(staffShifts.create({ ...defaults, ...data }));
  }
};

function StaffShiftConstructor(data) {
  const defaults = {
    userId: "",
    guildId: "",
    shiftType: "GENERAL",
    startedAt: new Date(),
    endedAt: null,
    durationMinutes: 0,
    status: "ACTIVE",
    ticketsHandled: 0,
    moderationsHandled: 0,
    messagesSent: 0,
    createdAt: new Date(),
  };
  const merged = { ...defaults, ...data };
  merged.save = function () {
    if (merged._id && staffShifts.data.has(merged._id)) {
      merged.updatedAt = new Date();
      const stored = { ...merged };
      delete stored.save;
      staffShifts.data.set(merged._id, stored);
      staffShifts.persist();
      return Promise.resolve(merged);
    }
    const created = staffShifts.create(merged);
    Object.assign(merged, created);
    return Promise.resolve(merged);
  };
  return merged;
}

StaffShiftConstructor.findOne = StaffShift.findOne;
StaffShiftConstructor.find = StaffShift.find;
StaffShiftConstructor.create = StaffShift.create;

module.exports = StaffShiftConstructor;
