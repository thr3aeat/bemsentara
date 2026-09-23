'use strict';

const FormSubmission = require('../../models/FormSubmission');
const { validateFormPayload } = require('./catalog');

function formError(statusCode, message, errors) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.errors = errors;
  return error;
}

async function notifySafely(submission) {
  try {
    const { getDiscordClient } = require('../../bot/discordClient');
    const { sendNewApplicationLog } = require('../../bot/services/staffRecruitmentPanelService');
    const client = getDiscordClient();
    if (client && client.isReady()) await sendNewApplicationLog(client, submission);
  } catch (_) {
    // A stored form must remain successful even when notification infrastructure is unavailable.
  }

  try {
    const { startFormInterviewFlow } = require('../../bot/services/formInterviewService');
    await startFormInterviewFlow(submission._id);
  } catch (_) {
    // Only staff forms have a matching interview flow; general forms are still valid submissions.
  }
}

async function submitCatalogForm({ definition, body, user, notify = notifySafely }) {
  if (!definition || definition.status !== 'open') {
    throw formError(404, 'Bu form şu anda başvuru kabul etmiyor.');
  }

  const checked = validateFormPayload(definition, body);
  if (!checked.valid) {
    throw formError(400, 'Lütfen işaretli alanları kontrol et.', checked.errors);
  }

  const userId = user?.discordId || `guest_${Date.now()}`;
  if (user) {
    const existing = await FormSubmission.findPendingByUser(userId, definition.formType);
    if (existing) throw formError(409, 'Bu form için incelenmekte olan bir başvurun bulunuyor.');
  }

  const submission = await FormSubmission.create({
    userId,
    discordId: user?.discordId || checked.values.discordId || userId,
    discordUsername: user?.discordUsername || user?.username || checked.values.discordUsername || 'Misafir',
    formType: definition.formType,
    formTitle: definition.title,
    formData: checked.values,
  });

  await notify(submission);
  return { submissionId: submission._id, message: 'Başvurun alındı.' };
}

module.exports = { formError, notifySafely, submitCatalogForm };
