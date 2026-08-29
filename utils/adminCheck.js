const { ADMIN_IDS } = require("../config");

function isEnvAdmin(discordId) {
  if (!discordId) return false;
  return ADMIN_IDS.map(String).includes(String(discordId).trim());
}

function isSiteAdmin(user) {
  if (!user || typeof user !== "object") return false;
  if (user.isBanned) return false;
  return Boolean(user.isAdmin) || isEnvAdmin(user.discordId);
}

function isSiteStaff(user) {
  if (!user || typeof user !== "object") return false;
  if (user.isBanned) return false;
  return Boolean(user.isStaff) || isSiteAdmin(user);
}

module.exports = { isEnvAdmin, isSiteAdmin, isSiteStaff };
