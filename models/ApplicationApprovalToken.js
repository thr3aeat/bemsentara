const crypto = require('crypto');
const { collections, InMemoryCollection, saveStoreNow } = require('./Store');

if (!collections.applicationApprovalTokens) {
  collections.applicationApprovalTokens = new InMemoryCollection('applicationApprovalTokens', saveStoreNow);
}

const tokens = collections.applicationApprovalTokens;

function hashToken(rawToken) {
  return crypto.createHash('sha256').update(String(rawToken)).digest('hex');
}

const ApplicationApprovalToken = {
  hashToken,

  async createTokenRecord({ submissionId, candidateDiscordId, createdBy = 'system', ttlMs = 24 * 60 * 60 * 1000 } = {}) {
    if (!submissionId) throw new Error('submissionId is required');
    if (!candidateDiscordId) throw new Error('candidateDiscordId is required');

    // Invalidate any existing open tokens for this submission
    await this.invalidateOpenForSubmission(submissionId, 'SUPERSEDED');

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlMs);

    const doc = {
      tokenHash,
      submissionId: String(submissionId),
      candidateDiscordId: String(candidateDiscordId),
      createdBy: String(createdBy),
      expiresAt: expiresAt.toISOString(),
      usedAt: null,
      usedBy: null,
      revokedAt: null,
      revokeReason: null,
      metadata: null,
      createdAt: now.toISOString()
    };

    const record = tokens.create(doc);
    return {
      rawToken,
      tokenHash,
      record
    };
  },

  async findValidByHash(tokenHash) {
    if (!tokenHash) return null;
    const all = tokens.find({ tokenHash });
    const now = Date.now();
    for (const rec of all) {
      if (!rec.usedAt && !rec.revokedAt && new Date(rec.expiresAt).getTime() > now) {
        return rec;
      }
    }
    return null;
  },

  async consume(tokenHash, metadata = {}) {
    if (!tokenHash) return null;
    const valid = await this.findValidByHash(tokenHash);
    if (!valid) return null;

    valid.usedAt = new Date().toISOString();
    valid.usedBy = metadata.candidateId || valid.candidateDiscordId || null;
    valid.metadata = metadata;

    tokens.data.set(valid._id, valid);
    tokens.persist();
    saveStoreNow();
    return valid;
  },

  async invalidateOpenForSubmission(submissionId, reason = 'SUPERSEDED') {
    if (!submissionId) return 0;
    const subIdStr = String(submissionId);
    const all = tokens.find({ submissionId: subIdStr });
    let count = 0;
    for (const rec of all) {
      if (!rec.usedAt && !rec.revokedAt) {
        rec.revokedAt = new Date().toISOString();
        rec.revokeReason = reason;
        tokens.data.set(rec._id, rec);
        count++;
      }
    }
    if (count > 0) {
      tokens.persist();
      saveStoreNow();
    }
    return count;
  },

  async findBySubmissionId(submissionId) {
    if (!submissionId) return [];
    return tokens.find({ submissionId: String(submissionId) });
  }
};

module.exports = ApplicationApprovalToken;
