const express = require('express');
const User = require('../../models/User');
const { TARGET_GUILD_ID, GUILD2_ID, SESSION_SECRET } = require('../../config');
const { getDiscordClient } = require('../../bot/discordClient');
const { createDiscordDmAuthService } = require('../services/discordDmAuthService');

const defaultService = createDiscordDmAuthService({
  clientProvider: () => getDiscordClient(),
  allowedGuildIds: [TARGET_GUILD_ID, GUILD2_ID],
  userRepo: User,
  hashSecret: SESSION_SECRET
});

function safeReturnPath(value) {
  const path = String(value || '');
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\')) return null;
  return /^\/(?:forms|application|ekoyildizda-calis)(?:[/?#]|$)/.test(path) ? path.slice(0, 500) : null;
}

function errorResponse(res, error) {
  const statusCode = [400, 403, 409, 429, 503].includes(error?.statusCode) ? error.statusCode : 500;
  return res.status(statusCode).json({
    success: false,
    error: statusCode === 500 ? 'Discord doğrulaması tamamlanamadı.' : error.message,
    ...(error?.code && statusCode !== 500 ? { code: error.code } : {})
  });
}

function buildApplicationAuthHandlers({ service = defaultService } = {}) {
  return {
    async requestCode(req, res) {
      try {
        const returnTo = safeReturnPath(req.body?.returnTo);
        if (returnTo) req.session.applicationReturnTo = returnTo;
        const data = await service.requestCode({ identifier: req.body?.identifier || req.body?.username, session: req.session, ip: req.ip });
        return res.json({ success: true, data });
      } catch (error) {
        return errorResponse(res, error);
      }
    },

    async verifyCode(req, res) {
      try {
        const result = await service.verifyCode({ code: req.body?.code, session: req.session, ip: req.ip });
        await new Promise((resolve, reject) => req.login(result.user, (error) => error ? reject(error) : resolve()));
        const redirectUrl = safeReturnPath(req.session.applicationReturnTo) || '/dashboard';
        delete req.session.applicationReturnTo;
        return res.json({ success: true, redirectUrl, user: result.user });
      } catch (error) {
        return errorResponse(res, error);
      }
    }
  };
}

const handlers = buildApplicationAuthHandlers();
const router = express.Router();
router.post('/api/application-auth/request-code', handlers.requestCode);
router.post('/api/application-auth/verify-code', handlers.verifyCode);

module.exports = { router, defaultService, buildApplicationAuthHandlers, safeReturnPath };
