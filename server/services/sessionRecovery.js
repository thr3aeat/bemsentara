'use strict';

const crypto = require('crypto');
const COOKIE_NAME = '__ekoyildiz_recovery';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function sign(value, secret) {
  return crypto.createHmac('sha256', secret).update(value).digest('base64url');
}

function createRecoveryToken(user, secret, now = Date.now()) {
  const subject = typeof user === 'object' && user !== null ? user : { _id: user };
  const payloadData = {
    uid: subject._id ? String(subject._id) : '',
    did: subject.discordId ? String(subject.discordId) : '',
    exp: now + MAX_AGE_MS
  };
  if (!payloadData.uid && !payloadData.did) return null;
  const payload = Buffer.from(JSON.stringify(payloadData)).toString('base64url');
  return `${payload}.${sign(payload, secret)}`;
}

function verifyRecoveryToken(token, secret, now = Date.now()) {
  if (!token || typeof token !== 'string') return null;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;
  const expected = sign(payload, secret);
  const actualBytes = Buffer.from(signature);
  const expectedBytes = Buffer.from(expected);
  if (actualBytes.length !== expectedBytes.length || !crypto.timingSafeEqual(actualBytes, expectedBytes)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return (data.uid || data.did) && Number.isFinite(data.exp) && data.exp >= now ? data : null;
  } catch {
    return null;
  }
}

function readCookie(header, name) {
  const part = String(header || '').split(';').map((item) => item.trim()).find((item) => item.startsWith(`${name}=`));
  return part ? decodeURIComponent(part.slice(name.length + 1)) : null;
}

const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: MAX_AGE_MS, path: '/' };
module.exports = { COOKIE_NAME, createRecoveryToken, verifyRecoveryToken, readCookie, cookieOptions };
