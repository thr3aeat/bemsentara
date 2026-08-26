// Veri deposu — bellek + disk (data/store.json) VEYA MongoDB
// MONGODB_URI env varsa MongoDB kullanır, yoksa dosya sistemi devam eder.
// Dışarıya açılan API tamamen aynı — hiçbir model/handler değişmez.

const crypto = require("crypto");
const { loadIntoCollections, scheduleSave, flushSave } = require("./persistence");
const db = require("./db");

class InMemoryCollection {
  constructor(name, onMutate) {
    this.name = name;
    this.data = new Map();
    this.onMutate = onMutate;
  }

  persist() {
    if (this.onMutate) this.onMutate();
  }

  _persist() {
    this.persist();
  }

  _generateId() {
    return crypto.randomBytes(12).toString("hex");
  }

  create(doc) {
    const id = this._generateId();
    const now = new Date();
    const record = {
      _id: id,
      ...doc,
      createdAt: doc.createdAt || now,
      updatedAt: now,
    };
    this.data.set(id, record);
    this._persist();

    // MongoDB'ye async yaz
    if (db.isMongoActive()) {
      db.upsertRecord(this.name, id, record).catch(() => {});
    }

    return this._wrap(record);
  }

  findOne(query) {
    for (const record of this.data.values()) {
      if (this._matches(record, query)) {
        return this._wrap(record);
      }
    }
    return null;
  }

  find(query) {
    const results = [];
    for (const record of this.data.values()) {
      if (this._matches(record, query)) {
        results.push(this._wrap(record));
      }
    }
    results.sort = function (sortObj) {
      const key = Object.keys(sortObj)[0];
      const dir = sortObj[key];
      return this.slice().sort((a, b) => {
        if (dir === -1) return (b[key] || 0) > (a[key] || 0) ? 1 : -1;
        return (a[key] || 0) > (b[key] || 0) ? 1 : -1;
      });
    };
    return results;
  }

  findById(id) {
    const record = this.data.get(id);
    return record ? this._wrap(record) : null;
  }

  _matches(record, query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined) continue;
      const a = record[key];
      const b = value;
      if (key === "discordId" || key === "robloxId" || key === "_id") {
        if (String(a) !== String(b)) return false;
      } else if (key === "caseCode" || key === "caseId") {
        const normA = String(a || "").trim().toUpperCase().replace(/^DAVA-?/, "");
        const normB = String(b || "").trim().toUpperCase().replace(/^DAVA-?/, "");
        if (normA !== normB) return false;
      } else if (a !== b) {
        return false;
      }
    }
    return true;
  }

  _wrap(record) {
    const self = this;
    const wrapped = { ...record };
    wrapped.save = function () {
      wrapped.updatedAt = new Date();
      const stored = { ...wrapped };
      delete stored.save;
      self.data.set(wrapped._id, stored);
      self._persist();

      // MongoDB'ye async yaz
      if (db.isMongoActive()) {
        db.upsertRecord(self.name, wrapped._id, stored).catch(() => {});
      }

      return Promise.resolve(wrapped);
    };
    return wrapped;
  }
}

function onStoreMutate() {
  // Dosya sistemi backup (MongoDB yoksa veya ek güvenlik için)
  scheduleSave(collections);
}

const rawCollectionsMap = new Map();

const collections = new Proxy({}, {
  get(target, prop) {
    if (typeof prop === 'symbol' || prop in Object.prototype || prop === 'then' || prop === 'toJSON') {
      return target[prop];
    }
    if (!rawCollectionsMap.has(prop)) {
      rawCollectionsMap.set(prop, new InMemoryCollection(String(prop), onStoreMutate));
    }
    return rawCollectionsMap.get(prop);
  },
  set(target, prop, value) {
    if (value) {
      rawCollectionsMap.set(prop, value);
    }
    return true;
  }
});

const courtCases     = collections.courtCases;
const investigations = collections.investigations;
const users          = collections.users;
const tickets        = collections.tickets;
const economies      = collections.economies;
const wikiArticles   = collections.wikiArticles;
const errorReports   = collections.errorReports;
const groupAdmins    = collections.groupAdmins;
const rankMetadata   = collections.rankMetadata;
const groupAuditLogs = collections.groupAuditLogs;
const posts          = collections.posts;
const stories        = collections.stories;
const liveStreams    = collections.liveStreams;
const appMeta        = collections.appMeta;
const formSubmissions = collections.formSubmissions;
/** @deprecated eski importlar için */
const wikis = wikiArticles;

function getRawCollectionsMap() {
  return rawCollectionsMap;
}

const ALL_COLLECTION_NAMES = [
  "users", "tickets", "economies", "courtCases", "investigations",
  "wikiArticles", "errorReports", "groupAdmins", "rankMetadata",
  "groupAuditLogs", "posts", "stories", "liveStreams", "appMeta",
  "formSubmissions", "modInterviews", "staffLeaves", "staffShifts",
  "modPerformances", "marketAuctions", "userTrustScores"
];

/**
 * Uygulama başlangıcında çağrılır.
 * MongoDB varsa oradan, yoksa dosyadan yükler.
 */
async function initStore() {
  // 1) MongoDB bağlantısını dene
  const mongoOk = await db.connectMongo();

  if (mongoOk) {
    // MongoDB'den yükle
    const colNames = ALL_COLLECTION_NAMES;
    const counts = {};

    for (const name of colNames) {
      if (!collections[name]) continue;
      const records = await db.loadCollectionFromMongo(name);
      if (records) {
        let count = 0;
        for (const [id, data] of Object.entries(records)) {
          if (!data || !id) continue;
          // Tarih alanlarını canlandır
          const revived = reviveDates(data);
          revived._id = id;
          collections[name].data.set(id, revived);
          count++;
        }
        counts[name] = count;
      } else {
        counts[name] = 0;
      }
    }

    // Eğer MongoDB boşsa ama dosyada veri varsa → dosyadan MongoDB'ye migrate et
    const totalMongo = Object.values(counts).reduce((a, b) => a + b, 0);
    if (totalMongo === 0) {
      const fileCounts = loadIntoCollections(collections);
      const totalFile = Object.values(fileCounts).reduce((a, b) => a + b, 0);
      if (totalFile > 0) {
        console.log(`[Store] Dosyadan ${totalFile} kayıt MongoDB'ye taşınıyor...`);
        await migrateFileToMongo();
        console.log("[Store] Migrasyon tamamlandı.");
        return fileCounts;
      }
    }

    return counts;
  } else {
    // Dosya sistemi fallback
    const counts = loadIntoCollections(collections);
    return counts;
  }
}

/** Dosyadaki tüm verileri MongoDB'ye toplu yazar */
async function migrateFileToMongo() {
  const colNames = ALL_COLLECTION_NAMES;
  for (const name of colNames) {
    if (collections[name]?.data) {
      await db.saveCollectionToMongo(name, collections[name].data);
    }
  }
}

async function saveStoreNow() {
  // Her iki sisteme de yaz
  flushSave(collections);
  if (db.isMongoActive()) {
    const colNames = ALL_COLLECTION_NAMES;
    const promises = colNames
      .filter(name => collections[name]?.data)
      .map(name => 
        db.saveCollectionToMongo(name, collections[name].data)
          .catch(err => console.error(`[Store] Toplu kayıt hatası (${name}):`, err.message))
      );
    await Promise.all(promises);
  }
}

// Tarih alanlarını string'den Date'e çevir
const DATE_FIELDS = new Set(["createdAt", "updatedAt", "joinedAt", "closedAt", "jailedUntil", "lastMuteCountedAt", "summonsSentAt", "lastMessageAt", "lastMentionAt", "lastMentionReminderAt"]);

function reviveDates(record) {
  if (!record || typeof record !== "object") return record;
  const out = { ...record };
  for (const key of DATE_FIELDS) {
    if (out[key] && typeof out[key] === "string") {
      out[key] = new Date(out[key]);
    }
  }
  if (Array.isArray(out.messages)) {
    out.messages = out.messages.map((m) => {
      if (m?.createdAt && typeof m.createdAt === "string") {
        return { ...m, createdAt: new Date(m.createdAt) };
      }
      return m;
    });
  }
  if (Array.isArray(out.comments)) {
    out.comments = out.comments.map((c) => {
      if (c?.createdAt && typeof c.createdAt === "string") {
        return { ...c, createdAt: new Date(c.createdAt) };
      }
      return c;
    });
  }
  return out;
}

module.exports = {
  collections,
  courtCases,
  investigations,
  users,
  tickets,
  economies,
  wikiArticles,
  errorReports,
  groupAdmins,
  rankMetadata,
  groupAuditLogs,
  posts,
  stories,
  liveStreams,
  appMeta,
  formSubmissions,
  wikis,
  InMemoryCollection,
  initStore,
  saveStoreNow,
  getRawCollectionsMap,
};
