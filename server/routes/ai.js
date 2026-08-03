'use strict';

const express = require('express');
const db = require('../db');
const { optionalAuth, requireAuth } = require('../auth');

const router = express.Router();

function mapLook(row, userId = null) {
  return {
    id: row.id,
    title: row.title,
    prompt: row.prompt,
    image_url: row.image_url,
    video_url: row.video_url,
    status: row.status,
    created_at: row.created_at,
    created_by: row.created_by,
    created_by_name: row.created_by_name,
    category_id: row.category_id,
    category_name: row.category_name,
    like_count: Number(row.like_count || 0),
    is_liked: !!row.is_liked,
  };
}

function lookSelect(userId) {
  return `
    SELECT a.*, c.name AS category_name, u.name AS created_by_name,
      (SELECT COUNT(*) FROM ai_look_likes l WHERE l.look_id = a.id) AS like_count,
      ${userId ? `EXISTS(SELECT 1 FROM ai_look_likes l2 WHERE l2.look_id = a.id AND l2.user_id = ${Number(userId)})` : '0'} AS is_liked
    FROM ai_looks a
    LEFT JOIN categories c ON c.id = a.category_id
    LEFT JOIN users u ON u.id = a.created_by
  `;
}

router.get('/looks', optionalAuth, (req, res) => {
  const { category, limit = 60, offset = 0, status = 'approved' } = req.query;
  const where = [];
  const params = [];
  if (status !== 'all') { where.push('a.status = ?'); params.push(status || 'approved'); }
  if (category) { where.push('c.slug = ?'); params.push(String(category)); }
  const rows = db.prepare(
    `${lookSelect(req.userId)} ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
     ORDER BY a.created_at DESC LIMIT ? OFFSET ?`
  ).all(...params, Number(limit), Number(offset));
  res.json({ looks: rows.map((r) => mapLook(r, req.userId)) });
});

router.get('/styles', (req, res) => {
  const styles = [
    { key: 'silky-long', label: 'Silky Long', blurb: 'Glass-hair straight, waist-length shine.' },
    { key: 'blunt-bob', label: 'Blunt Bob', blurb: 'Sharp, geometric, chin-grazing precision.' },
    { key: 'short-bob', label: 'Short Bob', blurb: 'Clean and chic, just above the shoulders.' },
    { key: 'half-shave', label: 'Half Headshave', blurb: 'Bold undercut contrast, one side shaved.' },
    { key: 'full-shave', label: 'Full Headshave', blurb: 'Confident, sculptural and skin-smooth.' },
    { key: 'very-long', label: 'Very Long Hair', blurb: 'Maximum length, maximum drama.' },
    { key: 'curly-blowout', label: 'Curly Blowout', blurb: 'Bouncy defined curls with movement.' },
    { key: 'braided', label: 'Braided', blurb: 'Tight, clean braided patterns.' },
  ];
  res.json({ styles });
});

router.post('/looks', requireAuth, (req, res) => {
  const { title, prompt, image_url, video_url, category_id } = req.body || {};
  if (!title || !image_url) return res.status(400).json({ error: 'Title and image URL are required.' });
  const user = db.prepare('SELECT role FROM users WHERE id = ?').get(req.userId);
  const info = db.prepare(
    'INSERT INTO ai_looks (title, prompt, image_url, video_url, category_id, created_by, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(
    String(title).trim().slice(0, 160), String(prompt || '').trim().slice(0, 1000),
    String(image_url), video_url || null, category_id ? Number(category_id) : null,
    req.userId, user.role === 'admin' ? 'approved' : 'pending'
  );
  res.status(201).json({ look_id: Number(info.lastInsertRowid), status: user.role === 'admin' ? 'approved' : 'pending' });
});

router.post('/looks/:id/like', requireAuth, (req, res) => {
  const look = db.prepare('SELECT id FROM ai_looks WHERE id = ?').get(Number(req.params.id));
  if (!look) return res.status(404).json({ error: 'Look not found.' });
  const existing = db.prepare('SELECT id FROM ai_look_likes WHERE user_id = ? AND look_id = ?').get(req.userId, look.id);
  let liked;
  if (existing) {
    db.prepare('DELETE FROM ai_look_likes WHERE id = ?').run(existing.id);
    liked = false;
  } else {
    db.prepare('INSERT INTO ai_look_likes (user_id, look_id) VALUES (?, ?)').run(req.userId, look.id);
    liked = true;
  }
  const count = Number(db.prepare('SELECT COUNT(*) AS n FROM ai_look_likes WHERE look_id = ?').get(look.id).n);
  res.json({ liked, like_count: count });
});

module.exports = router;
