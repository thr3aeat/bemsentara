// Ticket model - in-memory replacement for Mongoose model
const { tickets } = require("./Store");

const Ticket = {
  findOne(query) {
    return Promise.resolve(tickets.findOne(query));
  },

  findById(id) {
    return Promise.resolve(tickets.findById(id));
  },

  find(query) {
    const results = tickets.find(query) || [];
    let currentResults = Array.isArray(results) ? [...results] : [];
    const p = Promise.resolve(currentResults);
    p.sort = function(sortObj) {
      if (sortObj && typeof sortObj === 'object') {
        const [field, dir] = Object.entries(sortObj)[0] || ['createdAt', -1];
        currentResults.sort((a, b) => {
          const valA = a[field] ? new Date(a[field]).getTime() || a[field] : 0;
          const valB = b[field] ? new Date(b[field]).getTime() || b[field] : 0;
          return dir === -1 ? (valB > valA ? 1 : -1) : (valA > valB ? 1 : -1);
        });
      }
      return p;
    };
    p.limit = function(n) {
      if (typeof n === 'number' && n > 0) {
        currentResults.length = Math.min(currentResults.length, n);
      }
      return p;
    };
    p.lean = function() {
      return p;
    };
    return p;
  },

  countDocuments(query = {}) {
    return Promise.resolve(tickets.find(query).length);
  },
};

// Constructor-like: new Ticket({...}) then .save()
function TicketConstructor(data) {
  const defaults = {
    status: "open",
    priority: "medium",
    messages: [],
    createdAt: new Date(),
    closedAt: null,
    closeReason: null,
    closedBy: null,
    closedByName: null,
    claimedBy: null,
    claimedByName: null,
    rated: false,
    ratingScore: null,
    ratingNote: null,
    channelDeleted: false,
    channelDeletedAt: null,
    guildId: null,
    deliveryState: "delivered",
    deliveryError: null,
    deliveryErrorAt: null,
    panelMessageId: null,
    staffPanelMessageId: null,
    panelDeliveredAt: null,
    staffCallRequestedAt: null,
    staffCallCount: 0,
    source: "discord",  // "discord" | "web"
  };
  const merged = { ...defaults, ...data };
  merged.save = function () {
    const isNew = !merged._id;
    // Check if already in store (update) or new (create)
    if (merged._id) {
      const stored = tickets.findOne({ _id: merged._id });
      if (stored) {
        // Update existing
        Object.assign(stored, merged);
        stored.save();
        return Promise.resolve(merged);
      }
    }
    const created = tickets.create(merged);
    Object.assign(merged, created);

    if (isNew && (merged.status === "open" || merged.status === "pending_confirmation")) {
      try {
        const { notifyStaff } = require("../utils/notification");
        notifyStaff({
          title: "📬 Yeni Ticket Oluşturuldu",
          message: `\`${merged.ticketId}\` numaralı yeni bir destek talebi oluşturuldu. Konu: ${merged.subject || ''}`,
          icon: "📬"
        }).catch(err => console.error("notifyStaff error:", err));
      } catch (err) {
        console.error("notifyStaff require error:", err);
      }
    }

    return Promise.resolve(merged);
  };
  return merged;
}

TicketConstructor.findOne = Ticket.findOne;
TicketConstructor.findById = Ticket.findById;
TicketConstructor.find = Ticket.find;
TicketConstructor.countDocuments = Ticket.countDocuments;

module.exports = TicketConstructor;
