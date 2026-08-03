'use strict';

const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { signToken, requireAuth } = require('../auth');
const { verifyGoogleIdToken } = require('../lib/google');

const router = express.Router();

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';

function publicUser(u) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    avatar_url: u.avatar_url,
    role: u.role,
    is_banned: !!u.is_banned,
    created_at: u.created_at,
  };
}

router.post('/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body || {};
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Name, email and password are required.' });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(String(email).toLowerCase());
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }
    const hash = bcrypt.hashSync(String(password), 10);
    const info = db.prepare(
      'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)'
    ).run(String(email).toLowerCase(), hash, String(name).trim());
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ error: 'Signup failed.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(String(email).toLowerCase());
    if (!user || !user.password_hash) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    if (user.is_banned) {
      return res.status(403).json({ error: 'This account has been suspended.' });
    }
    if (!bcrypt.compareSync(String(password), user.password_hash)) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ error: 'Login failed.' });
  }
});

router.post('/google', async (req, res) => {
  try {
    const { id_token } = req.body || {};
    if (!id_token) return res.status(400).json({ error: 'Missing Google ID token.' });
    const payload = await verifyGoogleIdToken(id_token, CLIENT_ID);
    const email = String(payload.email).toLowerCase();
    let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      const info = db.prepare(
        'INSERT INTO users (email, name, google_id, avatar_url) VALUES (?, ?, ?, ?)'
      ).run(email, payload.name || email.split('@')[0], payload.sub, payload.picture || null);
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
    } else if (!user.google_id) {
      db.prepare('UPDATE users SET google_id = ? WHERE id = ?').run(payload.sub, user.id);
    }
    if (user.is_banned) {
      return res.status(403).json({ error: 'This account has been suspended.' });
    }
    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    res.status(401).json({ error: err.message || 'Google sign-in failed.' });
  }
});

router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  res.json({ user: publicUser(user) });
});

router.get('/google/config', (req, res) => {
  res.json({ enabled: !!CLIENT_ID, client_id: CLIENT_ID });
});

module.exports = router;
