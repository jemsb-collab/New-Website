'use strict';

const express = require('express');
const db = require('../db');
const { optionalAuth, requireAuth } = require('../auth');
const { listPosts, getPost } = require('../query');

const router = express.Router();

router.get('/', optionalAuth, (req, res) => {
  const { category, categoryId, search, sort, limit, offset } = req.query;
  const { posts, total } = listPosts({
    categoryId: categoryId ? Number(categoryId) : null,
    categorySlug: category,
    search,
    sort,
    limit,
    offset,
    userId: req.userId,
  });
  res.json({ posts, total });
});

router.get('/:id', optionalAuth, (req, res) => {
  const post = getPost(req.params.id, { userId: req.userId });
  if (!post || !post.is_published) {
    return res.status(404).json({ error: 'Post not found.' });
  }

  const cookieName = 'fm_views';
  let seen = {};
  try { seen = JSON.parse(req.cookies[cookieName] || '{}'); } catch { seen = {}; }
  const now = Date.now();
  if (!seen[post.id] || now - seen[post.id] > 60 * 1000) {
    db.prepare('UPDATE posts SET view_count = view_count + 1 WHERE id = ?').run(post.id);
    seen[post.id] = now;
    post.view_count = Number(post.view_count) + 1;
  }
  res.cookie(cookieName, JSON.stringify(seen), {
    httpOnly: true, sameSite: 'lax', path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });

  const images = db.prepare(
    'SELECT id, image_url FROM post_images WHERE post_id = ? ORDER BY sort_order ASC, id ASC'
  ).all(post.id);
  const comments = db.prepare(
    `SELECT cm.id, cm.body, cm.created_at, u.name AS user_name, u.avatar_url AS user_avatar
     FROM comments cm JOIN users u ON u.id = cm.user_id
     WHERE cm.post_id = ? ORDER BY cm.created_at DESC LIMIT 200`
  ).all(post.id);
  res.json({ post: { ...post, images, comments } });
});

router.post('/:id/like', requireAuth, (req, res) => {
  const post = getPost(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found.' });
  try {
    db.prepare('INSERT INTO likes (user_id, post_id) VALUES (?, ?)').run(req.userId, post.id);
  } catch { /* already liked */ }
  const count = db.prepare('SELECT COUNT(*) AS n FROM likes WHERE post_id = ?').get(post.id).n;
  res.json({ liked: true, like_count: Number(count) });
});

router.delete('/:id/like', requireAuth, (req, res) => {
  const post = getPost(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found.' });
  db.prepare('DELETE FROM likes WHERE user_id = ? AND post_id = ?').run(req.userId, post.id);
  const count = db.prepare('SELECT COUNT(*) AS n FROM likes WHERE post_id = ?').get(post.id).n;
  res.json({ liked: false, like_count: Number(count) });
});

router.post('/:id/save', requireAuth, (req, res) => {
  const post = getPost(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found.' });
  try {
    db.prepare('INSERT INTO saves (user_id, post_id) VALUES (?, ?)').run(req.userId, post.id);
  } catch { /* already saved */ }
  res.json({ saved: true });
});

router.delete('/:id/save', requireAuth, (req, res) => {
  const post = getPost(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found.' });
  db.prepare('DELETE FROM saves WHERE user_id = ? AND post_id = ?').run(req.userId, post.id);
  res.json({ saved: false });
});

router.post('/:id/comments', requireAuth, (req, res) => {
  const { body } = req.body || {};
  if (!body || !String(body).trim()) {
    return res.status(400).json({ error: 'Comment cannot be empty.' });
  }
  const post = getPost(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found.' });
  const info = db.prepare(
    'INSERT INTO comments (user_id, post_id, body) VALUES (?, ?, ?)'
  ).run(req.userId, post.id, String(body).trim().slice(0, 2000));
  const user = db.prepare('SELECT name, avatar_url FROM users WHERE id = ?').get(req.userId);
  res.status(201).json({
    id: Number(info.lastInsertRowid),
    body: String(body).trim().slice(0, 2000),
    created_at: db.prepare('SELECT created_at FROM comments WHERE id = ?').get(info.lastInsertRowid).created_at,
    user_name: user.name,
    user_avatar: user.avatar_url,
  });
});

router.delete('/:id/comments/:commentId', requireAuth, (req, res) => {
  const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(Number(req.params.commentId));
  if (!comment) return res.status(404).json({ error: 'Comment not found.' });
  const user = db.prepare('SELECT role FROM users WHERE id = ?').get(req.userId);
  if (comment.user_id !== req.userId && user.role !== 'admin') {
    return res.status(403).json({ error: 'Not allowed.' });
  }
  db.prepare('DELETE FROM comments WHERE id = ?').run(comment.id);
  res.json({ ok: true });
});

module.exports = router;
