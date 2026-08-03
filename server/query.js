'use strict';

const db = require('./db');

function postSelect(userId) {
  return `
    SELECT p.*,
      c.name AS category_name,
      c.slug AS category_slug,
      (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) AS like_count,
      (SELECT COUNT(*) FROM comments cm WHERE cm.post_id = p.id) AS comment_count,
      (SELECT COUNT(*) FROM saves s WHERE s.post_id = p.id) AS save_count,
      ${userId ? `EXISTS(SELECT 1 FROM likes l2 WHERE l2.post_id = p.id AND l2.user_id = ${Number(userId)})` : '0'} AS is_liked,
      ${userId ? `EXISTS(SELECT 1 FROM saves s2 WHERE s2.post_id = p.id AND s2.user_id = ${Number(userId)})` : '0'} AS is_saved
    FROM posts p
    LEFT JOIN categories c ON c.id = p.category_id
  `;
}

function mapPost(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category_id: row.category_id,
    category_name: row.category_name,
    category_slug: row.category_slug,
    youtube_link: row.youtube_link,
    telegram_link: row.telegram_link,
    drive_link: row.drive_link,
    thumbnail_url: row.thumbnail_url,
    view_count: row.view_count,
    is_premium: !!row.is_premium,
    price_cents: row.price_cents,
    is_published: !!row.is_published,
    created_at: row.created_at,
    updated_at: row.updated_at,
    like_count: Number(row.like_count || 0),
    comment_count: Number(row.comment_count || 0),
    save_count: Number(row.save_count || 0),
    is_liked: !!row.is_liked,
    is_saved: !!row.is_saved,
  };
}

function listPosts({ categoryId, categorySlug, search, sort = 'latest', limit = 24, offset = 0, publishedOnly = true, userId = null, isAdmin = false } = {}) {
  const where = [];
  const params = [];
  if (publishedOnly && !isAdmin) where.push('p.is_published = 1');
  if (categoryId) {
    where.push('p.category_id = ?');
    params.push(Number(categoryId));
  }
  if (categorySlug) {
    where.push('c.slug = ?');
    params.push(categorySlug);
  }
  if (search) {
    where.push('(p.title LIKE ? OR p.description LIKE ? OR c.name LIKE ?)');
    const term = `%${search}%`;
    params.push(term, term, term);
  }
  const orderBy = {
    latest: 'p.created_at DESC',
    popular: 'p.view_count DESC',
    engaged: '(p.view_count + (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) * 10) DESC',
    alpha: 'p.title ASC',
  }[sort] || 'p.created_at DESC';

  const rows = db.prepare(
    `${postSelect(userId)}
     ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
     ORDER BY ${orderBy}
     LIMIT ? OFFSET ?`
  ).all(...params, Number(limit), Number(offset));

  const total = Number(db.prepare(
    `SELECT COUNT(*) AS n FROM posts p LEFT JOIN categories c ON c.id = p.category_id
     ${where.length ? 'WHERE ' + where.join(' AND ') : ''}`
  ).get(...params).n);

  return { posts: rows.map(mapPost), total };
}

function getPost(id, { userId = null } = {}) {
  const row = db.prepare(`${postSelect(userId)} WHERE p.id = ?`).get(Number(id));
  return row ? mapPost(row) : null;
}

function getCategory(idOrSlug) {
  return db.prepare('SELECT * FROM categories WHERE id = ? OR slug = ?').get(
    Number(idOrSlug) || -1,
    String(idOrSlug)
  ) || null;
}

function getUserPublic(id) {
  return db.prepare(
    `SELECT u.id, u.name, u.email, u.avatar_url, u.role, u.created_at,
       (SELECT COUNT(*) FROM posts p WHERE p.created_by = u.id) AS post_count
     FROM users u WHERE u.id = ?`
  ).get(Number(id)) || null;
}

module.exports = { listPosts, getPost, getCategory, getUserPublic, mapPost };
