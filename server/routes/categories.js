'use strict';

const express = require('express');
const db = require('../db');
const { optionalAuth, requireAuth } = require('../auth');
const { getCategory } = require('../query');

const router = express.Router();

router.get('/', optionalAuth, (req, res) => {
  const rows = db.prepare(
    `SELECT c.*,
       (SELECT COUNT(*) FROM posts p WHERE p.category_id = c.id AND p.is_published = 1) AS post_count,
       (SELECT COUNT(*) FROM category_follows f WHERE f.category_id = c.id) AS follower_count,
       ${req.userId ? `EXISTS(SELECT 1 FROM category_follows f2 WHERE f2.category_id = c.id AND f2.user_id = ${Number(req.userId)})` : '0'} AS is_followed
     FROM categories c ORDER BY c.name ASC`
  ).all();
  res.json({
    categories: rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      description: r.description,
      post_count: Number(r.post_count),
      follower_count: Number(r.follower_count),
      is_followed: !!r.is_followed,
    })),
  });
});

router.get('/:slug', optionalAuth, (req, res) => {
  const cat = getCategory(req.params.slug);
  if (!cat) return res.status(404).json({ error: 'Category not found.' });
  let is_followed = 0;
  if (req.userId) {
    is_followed = db.prepare(
      'SELECT COUNT(*) AS n FROM category_follows WHERE category_id = ? AND user_id = ?'
    ).get(cat.id, req.userId).n;
  }
  const post_count = db.prepare(
    'SELECT COUNT(*) AS n FROM posts WHERE category_id = ? AND is_published = 1'
  ).get(cat.id).n;
  const follower_count = db.prepare(
    'SELECT COUNT(*) AS n FROM category_follows WHERE category_id = ?'
  ).get(cat.id).n;
  res.json({
    category: {
      id: cat.id, slug: cat.slug, name: cat.name, description: cat.description,
      post_count: Number(post_count), follower_count: Number(follower_count),
      is_followed: !!is_followed,
    },
  });
});

router.post('/:id/follow', requireAuth, (req, res) => {
  const cat = getCategory(req.params.id);
  if (!cat) return res.status(404).json({ error: 'Category not found.' });
  try {
    db.prepare('INSERT INTO category_follows (user_id, category_id) VALUES (?, ?)').run(req.userId, cat.id);
  } catch { /* already following */ }
  res.json({ followed: true });
});

router.delete('/:id/follow', requireAuth, (req, res) => {
  const cat = getCategory(req.params.id);
  if (!cat) return res.status(404).json({ error: 'Category not found.' });
  db.prepare('DELETE FROM category_follows WHERE user_id = ? AND category_id = ?').run(req.userId, cat.id);
  res.json({ followed: false });
});

module.exports = router;
