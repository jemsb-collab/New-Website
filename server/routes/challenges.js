'use strict';

const express = require('express');
const db = require('../db');
const { optionalAuth, requireAuth } = require('../auth');

const router = express.Router();

function mapChallenge(row, userId = null) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    duration_days: row.duration_days,
    goal: row.goal,
    image_url: row.image_url,
    category_id: row.category_id,
    category_name: row.category_name,
    created_by: row.created_by,
    created_by_name: row.created_by_name,
    created_at: row.created_at,
    participant_count: Number(row.participant_count || 0),
    update_count: Number(row.update_count || 0),
    is_joined: !!row.is_joined,
  };
}

function challengeSelect(userId) {
  return `
    SELECT ch.*,
      c.name AS category_name,
      u.name AS created_by_name,
      (SELECT COUNT(*) FROM challenge_participants p WHERE p.challenge_id = ch.id) AS participant_count,
      (SELECT COUNT(*) FROM challenge_updates up WHERE up.challenge_id = ch.id) AS update_count,
      ${userId ? `EXISTS(SELECT 1 FROM challenge_participants p2 WHERE p2.challenge_id = ch.id AND p2.user_id = ${Number(userId)})` : '0'} AS is_joined
    FROM challenges ch
    LEFT JOIN categories c ON c.id = ch.category_id
    LEFT JOIN users u ON u.id = ch.created_by
  `;
}

router.get('/', optionalAuth, (req, res) => {
  const rows = db.prepare(`${challengeSelect(req.userId)} ORDER BY ch.created_at DESC`).all();
  res.json({ challenges: rows.map((r) => mapChallenge(r, req.userId)) });
});

router.post('/', requireAuth, (req, res) => {
  const { title, description, duration_days, goal, image_url, category_id } = req.body || {};
  if (!title) return res.status(400).json({ error: 'Title is required.' });
  const info = db.prepare(
    'INSERT INTO challenges (title, description, duration_days, goal, image_url, category_id, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(
    String(title).trim().slice(0, 160), String(description || '').trim().slice(0, 3000),
    Number(duration_days) || 30, String(goal || '').trim().slice(0, 500),
    image_url || null, category_id ? Number(category_id) : null, req.userId
  );
  const row = db.prepare(`${challengeSelect(req.userId)} WHERE ch.id = ?`).get(info.lastInsertRowid);
  res.status(201).json({ challenge: mapChallenge(row, req.userId) });
});

router.get('/:id', optionalAuth, (req, res) => {
  const row = db.prepare(`${challengeSelect(req.userId)} WHERE ch.id = ?`).get(Number(req.params.id));
  if (!row) return res.status(404).json({ error: 'Challenge not found.' });
  const participants = db.prepare(
    `SELECT u.id, u.name, u.avatar_url FROM challenge_participants p JOIN users u ON u.id = p.user_id
     WHERE p.challenge_id = ? ORDER BY p.joined_at ASC`
  ).all(row.id);
  const updates = db.prepare(
    `SELECT up.id, up.body, up.image_url, up.created_at, u.name AS user_name, u.avatar_url AS user_avatar
     FROM challenge_updates up JOIN users u ON u.id = up.user_id
     WHERE up.challenge_id = ? ORDER BY up.created_at DESC LIMIT 200`
  ).all(row.id);
  res.json({ challenge: mapChallenge(row, req.userId), participants, updates });
});

router.post('/:id/join', requireAuth, (req, res) => {
  const challenge = db.prepare('SELECT id FROM challenges WHERE id = ?').get(Number(req.params.id));
  if (!challenge) return res.status(404).json({ error: 'Challenge not found.' });
  const existing = db.prepare(
    'SELECT id FROM challenge_participants WHERE user_id = ? AND challenge_id = ?'
  ).get(req.userId, challenge.id);
  let joined;
  if (existing) {
    db.prepare('DELETE FROM challenge_participants WHERE id = ?').run(existing.id);
    joined = false;
  } else {
    db.prepare('INSERT INTO challenge_participants (user_id, challenge_id) VALUES (?, ?)').run(req.userId, challenge.id);
    joined = true;
  }
  res.json({ joined, participant_count: Number(db.prepare(
    'SELECT COUNT(*) AS n FROM challenge_participants WHERE challenge_id = ?').get(challenge.id).n) });
});

router.post('/:id/updates', requireAuth, (req, res) => {
  const { body, image_url } = req.body || {};
  if (!body || !String(body).trim()) return res.status(400).json({ error: 'Update cannot be empty.' });
  const challenge = db.prepare('SELECT id FROM challenges WHERE id = ?').get(Number(req.params.id));
  if (!challenge) return res.status(404).json({ error: 'Challenge not found.' });
  const member = db.prepare(
    'SELECT id FROM challenge_participants WHERE user_id = ? AND challenge_id = ?'
  ).get(req.userId, challenge.id);
  if (!member) return res.status(400).json({ error: 'Join the challenge before posting updates.' });
  const info = db.prepare(
    'INSERT INTO challenge_updates (user_id, challenge_id, body, image_url) VALUES (?, ?, ?, ?)'
  ).run(req.userId, challenge.id, String(body).trim().slice(0, 2000), image_url || null);
  const user = db.prepare('SELECT name, avatar_url FROM users WHERE id = ?').get(req.userId);
  res.status(201).json({
    id: Number(info.lastInsertRowid),
    body: String(body).trim().slice(0, 2000),
    image_url: image_url || null,
    created_at: db.prepare('SELECT created_at FROM challenge_updates WHERE id = ?').get(info.lastInsertRowid).created_at,
    user_name: user.name,
    user_avatar: user.avatar_url,
  });
});

module.exports = router;
