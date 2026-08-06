const { collections } = require("./Store");
const staffLeaves = collections.staffLeaves;

/**
 * Personel İzin & Mazeret Talebi Modeli
 */
const StaffLeave = {
  findOne(query) {
    return Promise.resolve(staffLeaves.findOne(query));
  },
  find(query) {
    return Promise.resolve(staffLeaves.find(query));
  },
  create(data) {
    const defaults = {
      userId: "",
      guildId: "",
      reason: "",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
      durationDays: 1,
      status: "PENDING", // PENDING, APPROVED, REJECTED, EXPIRED
      approvedBy: null,
      approvedAt: null,
      rejectionReason: null,
      createdAt: new Date(),
    };
    return Promise.resolve(staffLeaves.create({ ...defaults, ...data }));
  }
};

function StaffLeaveConstructor(data) {
  const defaults = {
    userId: "",
    guildId: "",
    reason: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    durationDays: 1,
    status: "PENDING",
    approvedBy: null,
    approvedAt: null,
    rejectionReason: null,
    createdAt: new Date(),
  };
  const merged = { ...defaults, ...data };
  merged.save = function () {
    if (merged._id && staffLeaves.data.has(merged._id)) {
      merged.updatedAt = new Date();
      const stored = { ...merged };
      delete stored.save;
      staffLeaves.data.set(merged._id, stored);
      staffLeaves.persist();
      return Promise.resolve(merged);
    }
    const created = staffLeaves.create(merged);
    Object.assign(merged, created);
    return Promise.resolve(merged);
  };
  return merged;
}

StaffLeaveConstructor.findOne = StaffLeave.findOne;
StaffLeaveConstructor.find = StaffLeave.find;
StaffLeaveConstructor.create = StaffLeave.create;

module.exports = StaffLeaveConstructor;
