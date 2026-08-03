'use strict';

const jwt = require('jsonwebtoken');
const { KeyObject } = require('node:crypto');

const JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
let jwksCache = { keys: [], fetchedAt: 0 };
const CACHE_TTL = 60 * 60 * 1000;

async function getKeys() {
  const now = Date.now();
  if (now - jwksCache.fetchedAt > CACHE_TTL || jwksCache.keys.length === 0) {
    const res = await fetch(JWKS_URL, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error('Failed to fetch Google JWKS.');
    const data = await res.json();
    jwksCache = { keys: data.keys || [], fetchedAt: now };
  }
  return jwksCache.keys;
}

function keyFor(kid) {
  const keys = jwksCache.keys;
  return keys.find((k) => k.kid === kid) || keys[0];
}

async function verifyGoogleIdToken(idToken, clientId) {
  if (!clientId) throw new Error('Google login is not configured on this server.');
  const keys = await getKeys();
  const decoded = jwt.decode(idToken, { complete: true });
  if (!decoded || !decoded.header) throw new Error('Invalid Google ID token.');
  const key = keyFor(decoded.header.kid);
  if (!key) throw new Error('Unknown Google signing key.');

  const keyObject = KeyObject.from({ kty: key.kty, n: key.n, e: key.e });

  const payload = jwt.verify(idToken, keyObject, { algorithms: ['RS256'] });
  if (payload.aud !== clientId) throw new Error('Google token audience mismatch.');
  if (!['accounts.google.com', 'https://accounts.google.com'].includes(payload.iss)) {
    throw new Error('Google token issuer mismatch.');
  }
  if (!payload.email) throw new Error('Google token missing email.');
  return payload;
}

module.exports = { verifyGoogleIdToken };
