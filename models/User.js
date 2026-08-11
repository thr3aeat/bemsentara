// User model - in-memory replacement for Mongoose model
const { users } = require("./Store");

const User = {
  findOne(query) {
    return Promise.resolve(users.findOne(query));
  },

  findById(id) {
    return Promise.resolve(users.findById(id));
  },

  find(query) {
    return Promise.resolve(users.find(query));
  },

  create(data) {
    const defaults = {
      isAuthorized: false,
      isStaff: false,
      isAdmin: false,
      mfaEnabled: false,
      phoneVerified: false,
      roles: [],
      groupRole: null,
      canSetRole: false,
      canManageMembers: false,
      canManageTickets: false,
      botVerified: false,
      botPin: null,
      criminalRecord: [],
      isOrnekVatandas: true,
      profileBio: null,
      profileColor: "#7c6af7",
      browserNotificationsEnabled: false,
      browserNotificationPromptSent: false,
      gunsLolUrl: null,
      profileBgUrl: null,
      profileMusicUrl: null,
      customStatus: null,
      joinedAt: new Date(),
    };
    return Promise.resolve(users.create({ ...defaults, ...data }));
  },
};

// Constructor-like: new User({...}) then .save()
function UserConstructor(data) {
  const defaults = {
    isAuthorized: false,
    isStaff: false,
    isAdmin: false,
    mfaEnabled: false,
    phoneVerified: false,
    roles: [],
    isBanned: false,
    banReason: null,
    bannedAt: null,
    bannedBy: null,
    groupRole: null,
    canSetRole: false,
    canManageMembers: false,
    canManageTickets: false,
    botVerified: false,
    botPin: null,
    profileBio: null,
    profileColor: "#7c6af7",
    loginPassword: null, // 6-digit PIN for password-based login
    sitePassword: null, // bcrypt hashed strong password
    sitePinPassword: null, // User custom 4 or 6 digit PIN password
    pinLength: 4, // 4 or 6 digits
    twoFactorEnabled: false,
    twoFactorMethod: "discord", // "discord" or "roblox"
    passwordCreatedAt: null,
    browserNotificationsEnabled: false,
    browserNotificationPromptSent: false,
    gunsLolUrl: null,
    profileBgUrl: null,
    profileMusicUrl: null,
    customStatus: null,
    joinedAt: new Date(),
  };
  const merged = { ...defaults, ...data };
    merged.save = function () {
      // If this user already exists (has _id), update it
      if (merged._id && users.data.has(merged._id)) {
        merged.updatedAt = new Date();
        const stored = { ...merged };
        delete stored.save;
        users.data.set(merged._id, stored);
        users.persist();
        return Promise.resolve(merged);
      }
    // Otherwise create a new user
    const created = users.create(merged);
    // Copy _id back
    Object.assign(merged, created);
    return Promise.resolve(merged);
  };
  return merged;
}

UserConstructor.findOne = function (query) {
  const found = users.findOne(query);
  if (!found) return Promise.resolve(null);
  return Promise.resolve(UserConstructor(found));
};

UserConstructor.findById = function (id) {
  const found = users.findById(id);
  if (!found) return Promise.resolve(null);
  return Promise.resolve(UserConstructor(found));
};

UserConstructor.find = function (query) {
  const list = users.find(query);
  return Promise.resolve((list || []).map((u) => UserConstructor(u)));
};

UserConstructor.create = User.create;

module.exports = UserConstructor;
