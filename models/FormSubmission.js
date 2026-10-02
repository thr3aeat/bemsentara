/**
 * FormSubmission Model
 * Manages user application forms (e.g. Event Staff Form)
 */

const { collections, InMemoryCollection, saveStoreNow } = require("./Store");

if (!collections.formSubmissions) {
  collections.formSubmissions = new InMemoryCollection("formSubmissions", saveStoreNow);
}

const formSubmissions = collections.formSubmissions;

const VALID_STATUSES = ["PENDING", "APPROVED", "REJECTED", "AI_DETECTED"];

const { generateApplicationReference, deriveReferenceFromId, STAGES } = require("../server/services/recruitmentStages");

const FormSubmission = {
  STATUSES: {
    PENDING: "PENDING",
    APPROVED: "APPROVED",
    REJECTED: "REJECTED",
    AI_DETECTED: "AI_DETECTED",
  },
  STAGES,

  getReference(record) {
    if (!record) return null;
    return record.reference || deriveReferenceFromId(record._id, record.createdAt);
  },

  create(data) {
    const now = new Date();
    const reference = data.reference || generateApplicationReference(data.createdAt || now);
    const defaults = {
      status: "PENDING", // PENDING, APPROVED, REJECTED, AI_DETECTED
      applicationStage: STAGES.APPLICATION_RECEIVED,
      reference,
      reviewedBy: null,
      reviewNote: null,
      reviewedAt: null,
      operationHistory: [
        {
          id: `${Date.now()}-created`,
          action: 'APPLICATION_CREATED',
          actor: { name: 'Aday' },
          createdAt: now.toISOString(),
          description: 'Başvuru başarıyla oluşturuldu.'
        },
        {
          id: `${Date.now()}-received`,
          action: 'APPLICATION_RECEIVED',
          actor: { name: 'Sistem' },
          createdAt: now.toISOString(),
          description: 'Başvuru ön inceleme kuyruğuna alındı.'
        }
      ],
      createdAt: now,
    };
    return Promise.resolve(formSubmissions.create({ ...defaults, ...data, reference: data.reference || reference }));
  },

  findById(id) {
    return Promise.resolve(formSubmissions.findById(id));
  },

  findByReference(refOrId) {
    if (!refOrId) return Promise.resolve(null);
    const str = String(refOrId).trim();
    // Try by ID first
    const byId = formSubmissions.findById(str);
    if (byId) return Promise.resolve(byId);

    // Try by explicit reference
    const all = formSubmissions.find({});
    const byRef = all.find(r => r.reference === str || FormSubmission.getReference(r) === str);
    return Promise.resolve(byRef || null);
  },

  findByUser(userId) {
    const list = formSubmissions.find({ userId });
    return Promise.resolve(
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    );
  },

  findPendingByUser(userId, formType) {
    const list = formSubmissions.find({ userId, formType, status: "PENDING" });
    return Promise.resolve(list[0] || null);
  },

  findAll(query = {}) {
    const list = formSubmissions.find(query);
    return Promise.resolve(
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    );
  },

  updateStatus(id, status, reviewedBy, reviewNote = "") {
    if (!VALID_STATUSES.includes(status)) {
      return Promise.reject(new Error(`Geçersiz status: "${status}". Geçerli değerler: ${VALID_STATUSES.join(", ")}`));
    }
    const record = formSubmissions.findById(id);
    if (!record) return Promise.resolve(null);

    record.status = status;
    record.reviewedBy = reviewedBy;
    record.reviewNote = reviewNote;
    record.reviewedAt = new Date();

    formSubmissions.data.set(id, record);
    formSubmissions.persist();
    saveStoreNow();

    return Promise.resolve(record);
  },

  update(id, patch) {
    const record = formSubmissions.findById(id);
    if (!record) return Promise.resolve(null);

    Object.assign(record, patch);
    record.updatedAt = new Date();

    formSubmissions.data.set(id, record);
    formSubmissions.persist();
    saveStoreNow();

    return Promise.resolve(record);
  }
};

module.exports = FormSubmission;
