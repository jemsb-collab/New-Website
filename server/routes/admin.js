'use strict';

const express = require('express');
const db = require('../db');
const { requireAdmin } = require('../auth');
const { listPosts, getPost, getCategory } = require('../query');
const { getYouTubeThumb, getYouTubeId, getDriveFileId, getTelegramLink } = require('../lib/media');

const router = express.Router();
router.use(requireAdmin);

function normalizePostInput(body, partial = false) {
  const out = {};
  if (body.title !== undefined) out.title = String(body.title).trim();
  if (body.description !== undefined) out.description = String(body.description).trim();
  if (body.category_id !== undefined) out.category_id = body.category_id ? Number(body.category_id) : null;
  if (body.youtube_link !== undefined) out.youtube_link = body.youtube_link ? String(body.youtube_link).trim() : null;
  if (body.telegram_link !== undefined) out.telegram_link = body.telegram_link ? String(body.telegram_link).trim() : null;
  if (body.drive_link !== undefined) out.drive_link = body.drive_link ? String(body.drive_link).trim() : null;
  if (body.thumbnail_url !== undefined) out.thumbnail_url = body.thumbnail_url ? String(body.thumbnail_url).trim() : null;
  if (body.is_premium !== undefined) out.is_premium = body.is_premium ? 1 : 0;
  if (body.price_cents !== undefined) out.price_cents = body.price_cents ? Number(body.price_cents) : null;
  if (body.is_published !== undefined) out.is_published = body.is_published ? 1 : 0;
  if (body.created_by !== undefined) out.created_by = body.created_by ? Number(body.created_by) : null;

  if (out.youtube_link && !getYouTubeId(out.youtube_link)) {
    const err = new Error('YouTube link does not look valid.');
    err.status = 400;
    throw err;
  }
  if (out.drive_link && !getDriveFileId(out.drive_link)) {
    const err = new Error('Google Drive link does not look valid.');
    err.status = 400;
    throw err;
  }
  if (out.telegram_link && !getTelegramLink(out.telegram_link)) {
    const err = new Error('Telegram link does not look valid.');
    err.status = 400;
    throw err;
  }
  if (!out.thumbnail_url && out.youtube_link) {
    out.thumbnail_url = getYouTubeThumb(out.youtube_link);
  }
  return out;
}

router.get('/stats', (req, res) => {
  const one = (sql, ...p) => Number(db.prepare(sql).get(...p).n);
  const topPosts = db.prepare(
    `SELECT p.id, p.title, p.view_count,
       (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) AS like_count,
       (SELECT COUNT(*) FROM comments cm WHERE cm.post_id = p.id) AS comment_count
     FROM posts p ORDER BY p.view_count DESC LIMIT 8`
  ).all();
  const byCategory = db.prepare(
    `SELECT c.name, COUNT(p.id) AS n FROM categories c
     LEFT JOIN posts p ON p.category_id = c.id
     GROUP BY c.id ORDER BY n DESC`
  ).all().map((r) => ({ name: r.name, count: Number(r.n) }));

  res.json({
    stats: {
      posts: one('SELECT COUNT(*) AS n FROM posts'),
      published: one('SELECT COUNT(*) AS n FROM posts WHERE is_published = 1'),
      categories: one('SELECT COUNT(*) AS n FROM categories'),
      users: one('SELECT COUNT(*) AS n FROM users'),
      total_views: one('SELECT COALESCE(SUM(view_count),0) AS n FROM posts'),
      total_likes: one('SELECT COUNT(*) AS n FROM likes'),
      total_comments: one('SELECT COUNT(*) AS n FROM comments'),
      total_saves: one('SELECT COUNT(*) AS n FROM saves'),
    },
    top_posts: topPosts.map((p) => ({ ...p, like_count: Number(p.like_count), comment_count: Number(p.comment_count) })),
    by_category: byCategory,
  });
});

router.get('/posts', (req, res) => {
  const { search, categoryId, sort, limit, offset, published } = req.query;
  const { posts, total } = listPosts({
    categoryId: categoryId ? Number(categoryId) : null,
    search,
    sort,
    limit,
    offset,
    isAdmin: true,
    publishedOnly: false,
    ...(published !== undefined ? { publishedOnly: published !== 'all' } : {}),
  });
  res.json({ posts, total });
});

router.get('/posts/:id', (req, res) => {
  const post = getPost(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found.' });
  const images = db.prepare(
    'SELECT id, image_url FROM post_images WHERE post_id = ? ORDER BY sort_order ASC, id ASC'
  ).all(post.id);
  res.json({ post: { ...post, images } });
});

router.post('/posts', (req, res) => {
  try {
    const input = normalizePostInput(req.body || {});
    if (!input.title) return res.status(400).json({ error: 'Title is required.' });
    const info = db.prepare(
      `INSERT INTO posts (title, description, category_id, created_by, youtube_link, telegram_link, drive_link,
         thumbnail_url, view_count, is_premium, price_cents, is_published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`
    ).run(
      input.title, input.description || '', input.category_id || null, input.created_by || req.userId,
      input.youtube_link || null, input.telegram_link || null, input.drive_link || null,
      input.thumbnail_url || null, input.is_premium || 0, input.price_cents || null, input.is_published ?? 1
    );
    const post = getPost(info.lastInsertRowid);
    res.status(201).json({ post });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to create post.' });
  }
});

router.put('/posts/:id', (req, res) => {
  try {
    const post = getPost(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found.' });
    const input = normalizePostInput(req.body || {});
    const fields = [];
    const params = [];
    for (const [k, v] of Object.entries(input)) {
      fields.push(`${k} = ?`);
      params.push(v);
    }
    if (fields.length) {
      fields.push('updated_at = datetime(\'now\')');
      db.prepare(`UPDATE posts SET ${fields.join(', ')} WHERE id = ?`).run(...params, post.id);
    }
    res.json({ post: getPost(post.id) });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to update post.' });
  }
});

router.delete('/posts/:id', (req, res) => {
  const post = getPost(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found.' });
  db.prepare('DELETE FROM posts WHERE id = ?').run(post.id);
  res.json({ ok: true });
});

router.get('/categories', (req, res) => {
  const rows = db.prepare(
    `SELECT c.*,
       (SELECT COUNT(*) FROM posts p WHERE p.category_id = c.id) AS post_count,
       (SELECT COUNT(*) FROM category_follows f WHERE f.category_id = c.id) AS follower_count
     FROM categories c ORDER BY c.name ASC`
  ).all();
  res.json({ categories: rows });
});

router.post('/categories', (req, res) => {
  const { name, slug, description } = req.body || {};
  if (!name || !slug) return res.status(400).json({ error: 'Name and slug are required.' });
  const cleanSlug = String(slug).toLowerCase().replace(/[^a-z0-9-]/g, '-');
  try {
    const info = db.prepare(
      'INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)'
    ).run(String(name).trim(), cleanSlug, description || '');
    res.status(201).json({ category: getCategory(info.lastInsertRowid) });
  } catch {
    res.status(409).json({ error: 'Slug already exists.' });
  }
});

router.put('/categories/:id', (req, res) => {
  const cat = getCategory(req.params.id);
  if (!cat) return res.status(404).json({ error: 'Category not found.' });
  const { name, slug, description } = req.body || {};
  db.prepare('UPDATE categories SET name = ?, slug = ?, description = ? WHERE id = ?').run(
    name !== undefined ? String(name).trim() : cat.name,
    slug !== undefined ? String(slug).toLowerCase().replace(/[^a-z0-9-]/g, '-') : cat.slug,
    description !== undefined ? String(description).trim() : cat.description,
    cat.id
  );
  res.json({ category: getCategory(cat.id) });
});

router.delete('/categories/:id', (req, res) => {
  const cat = getCategory(req.params.id);
  if (!cat) return res.status(404).json({ error: 'Category not found.' });
  db.prepare('UPDATE posts SET category_id = NULL WHERE category_id = ?').run(cat.id);
  db.prepare('DELETE FROM category_follows WHERE category_id = ?').run(cat.id);
  db.prepare('DELETE FROM categories WHERE id = ?').run(cat.id);
  res.json({ ok: true });
});

router.get('/users', (req, res) => {
  const { search } = req.query;
  const term = `%${search || ''}%`;
  const rows = db.prepare(
    `SELECT u.id, u.email, u.name, u.avatar_url, u.role, u.is_banned, u.created_at,
       (SELECT COUNT(*) FROM comments cm WHERE cm.user_id = u.id) AS comment_count,
       (SELECT COUNT(*) FROM likes l WHERE l.user_id = u.id) AS like_count,
       (SELECT COUNT(*) FROM saves s WHERE s.user_id = u.id) AS save_count
     FROM users u
     WHERE (u.email LIKE ? OR u.name LIKE ?)
     ORDER BY u.created_at DESC LIMIT 500`
  ).all(term, term);
  res.json({ users: rows });
});

router.patch('/users/:id', (req, res) => {
  const { role, is_banned } = req.body || {};
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(Number(req.params.id));
  if (!user) return res.status(404).json({ error: 'User not found.' });
  if (user.id === req.userId) return res.status(400).json({ error: 'You cannot modify your own account.' });
  if (role !== undefined) {
    if (!['viewer', 'admin'].includes(role)) return res.status(400).json({ error: 'Invalid role.' });
    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, user.id);
  }
  if (is_banned !== undefined) {
    db.prepare('UPDATE users SET is_banned = ? WHERE id = ?').run(is_banned ? 1 : 0, user.id);
  }
  res.json({ ok: true });
});

router.delete('/users/:id', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(Number(req.params.id));
  if (!user) return res.status(404).json({ error: 'User not found.' });
  if (user.id === req.userId) return res.status(400).json({ error: 'You cannot delete your own account.' });
  db.prepare('DELETE FROM users WHERE id = ?').run(user.id);
  res.json({ ok: true });
});

module.exports = router;
