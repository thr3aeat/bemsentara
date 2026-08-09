/**
 * FormSubmission Model
 * Manages user application forms (e.g. Event Staff Form)
 */

const { collections, InMemoryCollection, saveStoreNow } = require("./Store");

if (!collections.formSubmissions) {
  collections.formSubmissions = new InMemoryCollection("formSubmissions", saveStoreNow);
}

const formSubmissions = collections.formSubmissions;

const FormSubmission = {
  create(data) {
    const defaults = {
      status: "PENDING", // PENDING, APPROVED, REJECTED
      reviewedBy: null,
      reviewNote: null,
      reviewedAt: null,
      createdAt: new Date(),
    };
    return Promise.resolve(formSubmissions.create({ ...defaults, ...data }));
  },

  findById(id) {
    return Promise.resolve(formSubmissions.findById(id));
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
  }
};

module.exports = FormSubmission;
