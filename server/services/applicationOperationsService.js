const FormSubmission = require('../../models/FormSubmission');
const { normalizeSubmissionAnswers } = require('./submissionAnswerNormalizer');

const STATUSES = new Set(['PENDING', 'APPROVED', 'REJECTED', 'AI_DETECTED']);
const ACTIONS = new Set([
  'start-review',
  'ask-question',
  'schedule-interview',
  'approve-time',
  'accept-interview',
  'reject-interview',
  'finish-interview',
  'resend-notification'
]);

class ApplicationOperationsError extends Error {
  constructor(message, statusCode = 400, code = 'APPLICATION_OPERATION_ERROR') {
    super(message);
    this.name = 'ApplicationOperationsError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

function text(value, max = 240) {
  return String(value == null ? '' : value).trim().slice(0, max);
}

function activityTime(record) {
  const timestamp = new Date(record.updatedAt || record.reviewedAt || record.createdAt || 0).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function candidateName(record) {
  return text(record.discordUsername || record.username || record.candidateName || record.userId || 'Aday', 100);
}

function summary(record) {
  return {
    id: String(record._id),
    status: record.status || 'PENDING',
    stage: record.applicationStage || record.interviewState || 'SUBMITTED',
    formType: record.formType || 'unknown',
    formTitle: record.formTitle || 'Başvuru',
    candidate: {
      id: record.userId ? String(record.userId) : null,
      discordId: record.targetDiscordId || record.discordId || record.userId || null,
      name: candidateName(record),
      avatar: record.avatar || null
    },
    notification: record.notificationStatus || null,
    createdAt: record.createdAt || null,
    updatedAt: record.updatedAt || record.reviewedAt || record.createdAt || null
  };
}

function detail(record, normalizer) {
  return {
    ...summary(record),
    answers: normalizer(record),
    review: {
      reviewedBy: record.reviewedBy || null,
      reviewedAt: record.reviewedAt || null,
      note: record.reviewNote || null
    },
    interview: {
      scheduledTime: record.interviewScheduledTime || null,
      timeApproved: Boolean(record.interviewTimeApproved),
      gameLink: record.robloxGameLink || null,
      state: record.interviewState || null
    },
    signature: record.signature ? {
      signedAt: record.signature.signedAt || null,
      signerName: record.signature.signerName || null,
      imageUrl: record.signature.imageUrl || null
    } : null,
    operationHistory: Array.isArray(record.operationHistory) ? record.operationHistory : []
  };
}

function requirePayload(action, payload) {
  const body = payload && typeof payload === 'object' ? payload : {};
  if (action === 'ask-question' && !text(body.questionText, 2000)) {
    throw new ApplicationOperationsError('Soru metni zorunludur.', 400, 'INVALID_PAYLOAD');
  }
  if (action === 'schedule-interview' && !text(body.scheduledTime, 160)) {
    throw new ApplicationOperationsError('Mülakat zamanı zorunludur.', 400, 'INVALID_PAYLOAD');
  }
  return body;
}

function transition(record, action, payload, actor) {
  const stage = record.applicationStage || record.interviewState || 'SUBMITTED';
  const patch = {};
  const allowed = (...states) => {
    if (!states.includes(stage)) {
      throw new ApplicationOperationsError(
        `“${action}” işlemi ${stage} aşamasında uygulanamaz.`,
        409,
        'INVALID_TRANSITION'
      );
    }
  };

  switch (action) {
    case 'start-review':
      allowed('SUBMITTED', 'PENDING');
      patch.applicationStage = 'REVIEWING';
      break;
    case 'ask-question':
      allowed('REVIEWING', 'QUESTION_PENDING', 'INTERVIEW_SCHEDULED', 'SCHEDULE_QUESTION');
      patch.applicationStage = 'QUESTION_PENDING';
      patch.lastQuestion = {
        key: text(payload.questionKey, 100) || null,
        label: text(payload.questionLabel, 240) || null,
        text: text(payload.questionText, 2000),
        askedAt: new Date().toISOString()
      };
      break;
    case 'schedule-interview':
      allowed('REVIEWING', 'QUESTION_PENDING');
      patch.applicationStage = 'INTERVIEW_SCHEDULED';
      patch.interviewState = 'SCHEDULE_QUESTION';
      patch.interviewScheduledTime = text(payload.scheduledTime, 160);
      patch.interviewTimeApproved = false;
      break;
    case 'approve-time':
      allowed('INTERVIEW_SCHEDULED', 'SCHEDULE_QUESTION');
      patch.applicationStage = 'TIME_APPROVED';
      patch.interviewState = 'TIME_APPROVED';
      patch.interviewTimeApproved = true;
      if (text(payload.scheduledTime, 160)) patch.interviewScheduledTime = text(payload.scheduledTime, 160);
      break;
    case 'accept-interview':
      allowed('TIME_APPROVED', 'INTERVIEW_COMPLETED');
      patch.applicationStage = 'ACCEPTED_WAITING_VERIFY';
      patch.interviewState = 'ACCEPTED_WAITING_VERIFY';
      patch.status = 'APPROVED';
      patch.reviewedBy = actor.name || actor.id || 'Admin';
      patch.reviewedAt = new Date().toISOString();
      break;
    case 'reject-interview':
      if (['REJECTED', 'FINISHED'].includes(stage)) {
        throw new ApplicationOperationsError(`“${action}” işlemi ${stage} aşamasında uygulanamaz.`, 409, 'INVALID_TRANSITION');
      }
      patch.applicationStage = 'REJECTED';
      patch.interviewState = 'REJECTED';
      patch.status = 'REJECTED';
      patch.reviewNote = text(payload.reason, 2000) || 'Neden belirtilmedi';
      patch.reviewedBy = actor.name || actor.id || 'Admin';
      patch.reviewedAt = new Date().toISOString();
      break;
    case 'finish-interview':
      allowed('TIME_APPROVED', 'ACCEPTED_WAITING_VERIFY');
      patch.applicationStage = 'FINISHED';
      patch.interviewState = 'FINISHED';
      break;
    default:
      break;
  }
  return patch;
}

function createApplicationOperationsService(deps = {}) {
  const repository = deps.FormSubmission || FormSubmission;
  const normalizer = deps.normalizeSubmissionAnswers || normalizeSubmissionAnswers;
  const notifier = deps.notifier || (async () => ({ channel: 'none' }));

  return {
    async list(filters = {}) {
      const status = text(filters.status, 30).toUpperCase();
      const formType = text(filters.formType, 100);
      const search = text(filters.search, 160).toLocaleLowerCase('tr-TR');
      const limitRaw = filters.limit == null || filters.limit === '' ? 100 : Number(filters.limit);
      if (status && !STATUSES.has(status)) {
        throw new ApplicationOperationsError('Geçersiz başvuru durumu.', 400, 'INVALID_FILTER');
      }
      if (!Number.isInteger(limitRaw) || limitRaw < 1 || limitRaw > 250) {
        throw new ApplicationOperationsError('Liste limiti 1-250 arasında olmalıdır.', 400, 'INVALID_FILTER');
      }

      let records = await repository.findAll();
      if (!Array.isArray(records)) records = [];
      records = records.filter((record) => {
        if (status && String(record.status || 'PENDING').toUpperCase() !== status) return false;
        if (formType && String(record.formType || '') !== formType) return false;
        if (search) {
          const haystack = [record._id, record.userId, record.discordId, record.targetDiscordId, candidateName(record), record.formTitle, record.formType]
            .filter(Boolean).join(' ').toLocaleLowerCase('tr-TR');
          if (!haystack.includes(search)) return false;
        }
        return true;
      });
      records.sort((a, b) => activityTime(b) - activityTime(a));
      return { items: records.slice(0, limitRaw).map(summary), total: records.length };
    },

    async getDetail(id) {
      const record = await repository.findById(String(id || ''));
      if (!record) throw new ApplicationOperationsError('Başvuru bulunamadı.', 404, 'NOT_FOUND');
      return detail(record, normalizer);
    },

    async performAction({ id, action, payload = {}, actor = {}, idempotencyKey }) {
      if (!ACTIONS.has(action)) throw new ApplicationOperationsError('Bilinmeyen başvuru işlemi.', 400, 'UNKNOWN_ACTION');
      if (!text(idempotencyKey, 160)) throw new ApplicationOperationsError('Idempotency-Key zorunludur.', 400, 'IDEMPOTENCY_KEY_REQUIRED');
      const record = await repository.findById(String(id || ''));
      if (!record) throw new ApplicationOperationsError('Başvuru bulunamadı.', 404, 'NOT_FOUND');

      const previousKeys = Array.isArray(record.operationKeys) ? record.operationKeys : [];
      const previous = previousKeys.find((entry) => entry.key === idempotencyKey);
      if (previous) return { ...previous.result, replayed: true };

      const body = requirePayload(action, payload);
      let patch = {};
      if (action === 'resend-notification') {
        if (record.notificationStatus?.state !== 'FAILED') {
          throw new ApplicationOperationsError('Yeniden gönderilebilecek başarısız bir bildirim yok.', 409, 'NOTIFICATION_NOT_RETRYABLE');
        }
      } else {
        patch = transition(record, action, body, actor);
      }

      const operation = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        action,
        actor: { id: actor.id || null, name: actor.name || null },
        payload: body,
        createdAt: new Date().toISOString()
      };
      let persisted = await repository.update(record._id, {
        ...patch,
        operationHistory: [...(record.operationHistory || []), operation].slice(-100)
      });

      let notification;
      try {
        const sent = await notifier({ application: persisted, action, payload: body, actor });
        notification = { state: 'SENT', sentAt: new Date().toISOString(), channel: sent?.channel || 'discord_dm', error: null };
      } catch (error) {
        notification = { state: 'FAILED', failedAt: new Date().toISOString(), channel: 'discord_dm', error: text(error?.message || error, 500) };
      }
      persisted = await repository.update(record._id, { notificationStatus: notification });
      const result = { application: summary(persisted), notification, replayed: false };
      const operationKeys = [...previousKeys, { key: idempotencyKey, result, createdAt: new Date().toISOString() }].slice(-50);
      persisted = await repository.update(record._id, { operationKeys });
      result.application = summary(persisted);
      return result;
    }
  };
}

module.exports = {
  ACTIONS,
  ApplicationOperationsError,
  createApplicationOperationsService
};
