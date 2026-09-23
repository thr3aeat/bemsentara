'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const FormSubmission = require('../models/FormSubmission');
const { getFormDefinition } = require('../server/forms/catalog');
const { submitCatalogForm } = require('../server/forms/submissionService');
const express = require('express');
const apiRouter = require('../server/routes/api');

async function requestApi(pathname, body) {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => { req.user = null; next(); });
  app.use(apiRouter);
  const server = await new Promise((resolve) => {
    const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
  });

  try {
    const { port } = server.address();
    return await fetch(`http://127.0.0.1:${port}${pathname}`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
    });
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

test('contact submission persists validated values and returns its id', async () => {
  const result = await submitCatalogForm({
    definition: getFormDefinition('contact'),
    body: {
      subject: 'Topluluk sorusu',
      message: 'Etkinliğe nasıl katılırım?',
      replyPreference: 'Discord',
    },
    user: { discordId: 'forms-test-contact', username: 'Forms Test' },
    notify: async () => {},
  });

  const saved = await FormSubmission.findById(result.submissionId);
  assert.equal(result.message, 'Başvurun alındı.');
  assert.equal(saved.formType, 'contact');
  assert.equal(saved.formData.subject, 'Topluluk sorusu');
});

test('community ambassador validation has no expired-deadline branch', async () => {
  await assert.rejects(
    submitCatalogForm({
      definition: getFormDefinition('community-ambassador'),
      body: {}, user: null, notify: async () => {},
    }),
    (error) => error.statusCode === 400
      && /Lütfen işaretli alanları kontrol et/.test(error.message)
      && !/20 saat|sürenin dolması/i.test(error.message)
  );
});

test('catalog API saves a general form through its public endpoint', async () => {
  const response = await requestApi('/api/forms/contact/submit', {
    subject: 'Topluluk sorusu',
    message: 'Etkinliğe nasıl katılırım?',
    replyPreference: 'Discord',
  });
  const body = await response.json();

  assert.equal(response.status, 201);
  assert.equal(body.success, true);
  assert.match(body.submissionId, /.+/);
});
