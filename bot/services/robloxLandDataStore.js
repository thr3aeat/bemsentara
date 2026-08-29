const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "../../data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadJson(file, fallback = {}) {
  try {
    const fullPath = path.join(DATA_DIR, file);
    if (!fs.existsSync(fullPath)) return fallback;
    return JSON.parse(fs.readFileSync(fullPath, "utf8"));
  } catch (e) {
    return fallback;
  }
}

function saveJson(file, data) {
  try {
    const fullPath = path.join(DATA_DIR, file);
    fs.writeFileSync(fullPath, JSON.stringify(data, null, 2), "utf8");
  } catch (e) {
    console.error(`[DataStore] Save error (${file}):`, e.message);
  }
}

// ─── 1. TICKET STORE & COUNTER ───────────────────────────────────────────────
const TICKETS_FILE = "robloxland_tickets.json";
const TICKETS_META = "robloxland_ticket_meta.json";

function getNextTicketId() {
  const meta = loadJson(TICKETS_META, { lastId: 480 });
  meta.lastId = (meta.lastId || 480) + 1;
  saveJson(TICKETS_META, meta);
  return `RBLX-${String(meta.lastId).padStart(5, "0")}`;
}

function saveTicketData(channelId, data) {
  const all = loadJson(TICKETS_FILE, {});
  all[channelId] = { ...(all[channelId] || {}), ...data, updatedAt: new Date().toISOString() };
  saveJson(TICKETS_FILE, all);
}

function getTicketData(channelId) {
  const all = loadJson(TICKETS_FILE, {});
  return all[channelId] || null;
}

function findTicketByNumber(ticketNumber) {
  const clean = String(ticketNumber).trim().toUpperCase();
  const all = loadJson(TICKETS_FILE, {});
  for (const [chanId, t] of Object.entries(all)) {
    if (t.ticketId === clean || t.ticketId?.endsWith(clean)) {
      return { channelId: chanId, ...t };
    }
  }
  return null;
}

// ─── 2. USER PROFILES & TRUST SCORE & COINS ──────────────────────────────────
const PROFILES_FILE = "robloxland_profiles.json";

function getUserProfile(userId, guildMember = null) {
  const all = loadJson(PROFILES_FILE, {});
  if (!all[userId]) {
    all[userId] = {
      userId,
      level: 1,
      xp: 45,
      landCoins: 50,
      trustScore: 92,
      openedTickets: 0,
      completedOrders: 0,
      totalSpent: 0,
      vipTier: "Standart",
      joinedAt: guildMember?.joinedAt ? new Date(guildMember.joinedAt).toISOString() : new Date().toISOString()
    };
    saveJson(PROFILES_FILE, all);
  }
  return all[userId];
}

function updateUserProfile(userId, updateFn) {
  const all = loadJson(PROFILES_FILE, {});
  const current = all[userId] || {
    userId,
    level: 1,
    xp: 0,
    landCoins: 0,
    trustScore: 90,
    openedTickets: 0,
    completedOrders: 0,
    totalSpent: 0,
    vipTier: "Standart",
    joinedAt: new Date().toISOString()
  };
  const updated = updateFn(current) || current;
  all[userId] = updated;
  saveJson(PROFILES_FILE, all);
  return updated;
}

// ─── 3. STAFF STATS & RATINGS ────────────────────────────────────────────────
const STAFF_STATS_FILE = "robloxland_staff_stats.json";

function getStaffStats(staffId) {
  const all = loadJson(STAFF_STATS_FILE, {});
  if (!all[staffId]) {
    all[staffId] = {
      staffId,
      resolvedTickets: 0,
      totalRatingScore: 0,
      ratingCount: 0,
      completedSales: 0,
      ratings: []
    };
  }
  return all[staffId];
}

function addStaffRating(staffId, stars, raterId = null, feedback = "") {
  const all = loadJson(STAFF_STATS_FILE, {});
  const staff = all[staffId] || {
    staffId,
    resolvedTickets: 0,
    totalRatingScore: 0,
    ratingCount: 0,
    completedSales: 0,
    ratings: []
  };

  const score = Math.max(1, Math.min(5, Number(stars) || 5));
  staff.totalRatingScore += score;
  staff.ratingCount += 1;
  staff.ratings.push({ score, raterId, feedback, date: new Date().toISOString() });

  all[staffId] = staff;
  saveJson(STAFF_STATS_FILE, all);
  return staff;
}

function incrementStaffStat(staffId, field, amount = 1) {
  const all = loadJson(STAFF_STATS_FILE, {});
  const staff = all[staffId] || {
    staffId,
    resolvedTickets: 0,
    totalRatingScore: 0,
    ratingCount: 0,
    completedSales: 0,
    ratings: []
  };
  staff[field] = (staff[field] || 0) + amount;
  all[staffId] = staff;
  saveJson(STAFF_STATS_FILE, all);
  return staff;
}

// ─── 4. SCAM CASES & BLACKLIST ───────────────────────────────────────────────
const CASES_FILE = "robloxland_cases.json";
const CASES_META = "robloxland_cases_meta.json";
const BLACKLIST_FILE = "robloxland_blacklist.json";

function getNextCaseId() {
  const meta = loadJson(CASES_META, { lastId: 35 });
  meta.lastId = (meta.lastId || 35) + 1;
  saveJson(CASES_META, meta);
  return `SC-${String(meta.lastId).padStart(4, "0")}`;
}

function saveCase(caseId, data) {
  const all = loadJson(CASES_FILE, {});
  all[caseId] = { ...(all[caseId] || {}), ...data, caseId, updatedAt: new Date().toISOString() };
  saveJson(CASES_FILE, all);
  return all[caseId];
}

function getCase(caseId) {
  const all = loadJson(CASES_FILE, {});
  return all[caseId] || null;
}

function addToBlacklist(userId, reason, officerId, caseId = null) {
  const all = loadJson(BLACKLIST_FILE, {});
  all[userId] = {
    userId,
    reason,
    officerId,
    caseId,
    bannedAt: new Date().toISOString()
  };
  saveJson(BLACKLIST_FILE, all);

  // Güven puanını sıfırla
  updateUserProfile(userId, (p) => {
    p.trustScore = 0;
    return p;
  });
}

function checkBlacklist(userId) {
  const all = loadJson(BLACKLIST_FILE, {});
  return all[userId] || null;
}

// ─── 5. COUPONS ─────────────────────────────────────────────────────────────
const COUPONS_FILE = "robloxland_coupons.json";

function getCoupons() {
  return loadJson(COUPONS_FILE, {
    EKOSTAR10: { code: "EKOSTAR10", discountPercent: 10, type: "percent", desc: "%10 Eko Yıldız Özel İndirimi" },
    ROBLOXLND20: { code: "ROBLOXLND20", discountPercent: 20, type: "percent", desc: "%20 RobloxLand Açılış İndirimi" },
    VIP50: { code: "VIP50", discountAmount: 50, type: "flat", desc: "50 TL Nakit İndirim" }
  });
}

function checkCoupon(code) {
  if (!code) return null;
  const coupons = getCoupons();
  const clean = String(code).trim().toUpperCase();
  return coupons[clean] || null;
}

module.exports = {
  getNextTicketId,
  saveTicketData,
  getTicketData,
  findTicketByNumber,
  getUserProfile,
  updateUserProfile,
  getStaffStats,
  addStaffRating,
  incrementStaffStat,
  getNextCaseId,
  saveCase,
  getCase,
  addToBlacklist,
  checkBlacklist,
  getCoupons,
  checkCoupon
};
