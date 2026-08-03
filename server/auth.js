'use strict';

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'filora-dev-secret-change-me';
const TOKEN_TTL = '30d';

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: TOKEN_TTL }
  );
}

function parseToken(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  const token = header.slice(7);
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

function requireAuth(req, res, next) {
  const payload = parseToken(req);
  if (!payload) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  req.userId = payload.id;
  req.userRole = payload.role || 'viewer';
  next();
}

function requireAdmin(req, res, next) {
  const payload = parseToken(req);
  if (!payload) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  if (payload.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  req.userId = payload.id;
  req.userRole = 'admin';
  next();
}

function optionalAuth(req, res, next) {
  const payload = parseToken(req);
  if (payload) {
    req.userId = payload.id;
    req.userRole = payload.role || 'viewer';
  }
  next();
}

module.exports = { signToken, requireAuth, requireAdmin, optionalAuth, parseToken };
