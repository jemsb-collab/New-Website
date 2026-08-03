'use strict';

const express = require('express');
const db = require('../db');
const { requireAuth } = require('../auth');
const { listPosts } = require('../query');

const router = express.Router();

router.get('/me/saves', requireAuth, (req, res) => {
  const saved = db.prepare(
    `SELECT post_id FROM saves WHERE user_id = ? ORDER BY id DESC LIMIT 200`
  ).all(req.userId);
  const ids = saved.map((s) => Number(s.post_id));
  if (ids.length === 0) return res.json({ posts: [], total: 0 });
  const rows = db.prepare(
    `SELECT p.*, c.name AS category_name, c.slug AS category_slug,
       (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) AS like_count,
       (SELECT COUNT(*) FROM comments cm WHERE cm.post_id = p.id) AS comment_count,
       (SELECT COUNT(*) FROM saves s WHERE s.post_id = p.id) AS save_count,
       1 AS is_saved,
       EXISTS(SELECT 1 FROM likes l2 WHERE l2.post_id = p.id AND l2.user_id = ${Number(req.userId)}) AS is_liked
     FROM posts p LEFT JOIN categories c ON c.id = p.category_id
     WHERE p.id IN (${ids.map(() => '?').join(',')})`
  ).all(...ids);
  const { mapPost } = require('../query');
  res.json({ posts: rows.map(mapPost), total: rows.length });
});

router.get('/me/follows', requireAuth, (req, res) => {
  const rows = db.prepare(
    `SELECT c.id, c.slug, c.name, c.description,
       (SELECT COUNT(*) FROM posts p WHERE p.category_id = c.id AND p.is_published = 1) AS post_count
     FROM category_follows f JOIN categories c ON c.id = f.category_id
     WHERE f.user_id = ? ORDER BY f.id DESC`
  ).all(req.userId);
  res.json({ categories: rows.map((r) => ({
    id: r.id, slug: r.slug, name: r.name, description: r.description,
    post_count: Number(r.post_count), is_followed: true,
  })) });
});

router.get('/me/stats', requireAuth, (req, res) => {
  const liked = db.prepare('SELECT COUNT(*) AS n FROM likes WHERE user_id = ?').get(req.userId).n;
  const saved = db.prepare('SELECT COUNT(*) AS n FROM saves WHERE user_id = ?').get(req.userId).n;
  const comments = db.prepare('SELECT COUNT(*) AS n FROM comments WHERE user_id = ?').get(req.userId).n;
  const following = db.prepare('SELECT COUNT(*) AS n FROM category_follows WHERE user_id = ?').get(req.userId).n;
  res.json({ liked: Number(liked), saved: Number(saved), comments: Number(comments), following: Number(following) });
});

module.exports = router;
