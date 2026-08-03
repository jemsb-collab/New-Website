'use strict';

const express = require('express');
const db = require('../db');
const { optionalAuth, requireAuth } = require('../auth');

const router = express.Router();

function mapListing(row, userId = null) {
  if (!row) return null;
  let photos = [];
  try { photos = JSON.parse(row.photos || '[]'); } catch { photos = []; }
  const reviews = Number(row.review_count || 0);
  const ratingSum = Number(row.rating_sum || 0);
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    hair_type: row.hair_type,
    texture: row.texture,
    color: row.color,
    length_cm: row.length_cm,
    weight_grams: row.weight_grams,
    price_cents: row.price_cents,
    currency: row.currency,
    photos,
    cover: photos[0] || null,
    status: row.status,
    view_count: row.view_count,
    created_at: row.created_at,
    seller_id: row.seller_id,
    seller_name: row.seller_name,
    seller_avatar: row.seller_avatar,
    seller_role: row.seller_role,
    comment_count: Number(row.comment_count || 0),
    interest_count: Number(row.interest_count || 0),
    rating_avg: reviews ? +(ratingSum / reviews).toFixed(1) : null,
    rating_count: reviews,
    is_interested: !!row.is_interested,
  };
}

function listingSelect(userId) {
  return `
    SELECT l.*,
      u.name AS seller_name, u.avatar_url AS seller_avatar, u.role AS seller_role,
      (SELECT COUNT(*) FROM listing_comments c WHERE c.listing_id = l.id) AS comment_count,
      (SELECT COUNT(*) FROM listing_interests i WHERE i.listing_id = l.id) AS interest_count,
      (SELECT COUNT(*) FROM reviews r WHERE r.listing_id = l.id) AS review_count,
      (SELECT COALESCE(SUM(r.rating), 0) FROM reviews r WHERE r.listing_id = l.id) AS rating_sum,
      ${userId ? `EXISTS(SELECT 1 FROM listing_interests i2 WHERE i2.listing_id = l.id AND i2.user_id = ${Number(userId)})` : '0'} AS is_interested
    FROM hair_listings l
    JOIN users u ON u.id = l.seller_id
  `;
}

router.get('/', optionalAuth, (req, res) => {
  const { search, hair_type, texture, color, sort, limit = 24, offset = 0, status = 'active' } = req.query;
  const where = [];
  const params = [];
  if (status !== 'all') {
    where.push('l.status = ?');
    params.push(status === 'active' ? 'active' : 'sold');
  }
  if (hair_type) { where.push('l.hair_type = ?'); params.push(String(hair_type)); }
  if (texture) { where.push('l.texture = ?'); params.push(String(texture)); }
  if (color) { where.push('l.color = ?'); params.push(String(color)); }
  if (search) {
    where.push('(l.title LIKE ? OR l.description LIKE ? OR l.hair_type LIKE ?)');
    const t = `%${search}%`;
    params.push(t, t, t);
  }
  const orderBy = {
    latest: 'l.created_at DESC',
    price_low: 'l.price_cents ASC',
    price_high: 'l.price_cents DESC',
    popular: 'l.view_count DESC',
  }[sort] || 'l.created_at DESC';

  const rows = db.prepare(
    `${listingSelect(req.userId)} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY ${orderBy} LIMIT ? OFFSET ?`
  ).all(...params, Number(limit), Number(offset));
  const total = Number(db.prepare(
    `SELECT COUNT(*) AS n FROM hair_listings l ${where.length ? 'WHERE ' + where.join(' AND ') : ''}`
  ).get(...params).n);

  res.json({ listings: rows.map((r) => mapListing(r, req.userId)), total });
});

router.get('/:id', optionalAuth, (req, res) => {
  const row = db.prepare(`${listingSelect(req.userId)} WHERE l.id = ?`).get(Number(req.params.id));
  if (!row) return res.status(404).json({ error: 'Listing not found.' });

  const cookieName = 'fm_lviews';
  let seen = {};
  try { seen = JSON.parse(req.cookies[cookieName] || '{}'); } catch { seen = {}; }
  const now = Date.now();
  if (!seen[row.id] || now - seen[row.id] > 60 * 1000) {
    db.prepare('UPDATE hair_listings SET view_count = view_count + 1 WHERE id = ?').run(row.id);
    seen[row.id] = now;
    row.view_count = Number(row.view_count) + 1;
  }
  res.cookie(cookieName, JSON.stringify(seen), { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 31536000000 });

  const listing = mapListing(row, req.userId);
  const comments = db.prepare(
    `SELECT c.id, c.body, c.created_at, u.name AS user_name, u.avatar_url AS user_avatar
     FROM listing_comments c JOIN users u ON u.id = c.user_id
     WHERE c.listing_id = ? ORDER BY c.created_at DESC LIMIT 300`
  ).all(listing.id);
  const reviews = db.prepare(
    `SELECT r.id, r.rating, r.body, r.created_at, u.name AS user_name, u.avatar_url AS user_avatar
     FROM reviews r JOIN users u ON u.id = r.user_id
     WHERE r.listing_id = ? ORDER BY r.created_at DESC LIMIT 100`
  ).all(listing.id);
  const sellerStats = db.prepare(
    `SELECT
       (SELECT COUNT(*) FROM reviews r WHERE r.seller_id = ?) AS review_count,
       (SELECT COALESCE(AVG(r.rating),0) FROM reviews r WHERE r.seller_id = ?) AS avg_rating,
       (SELECT COUNT(*) FROM hair_listings l WHERE l.seller_id = ?) AS listing_count`
  ).get(listing.seller_id, listing.seller_id, listing.seller_id);

  res.json({
    listing,
    comments: comments.map((c) => ({ ...c, created_at: c.created_at })),
    reviews: reviews.map((r) => ({ ...r, created_at: r.created_at })),
    seller_stats: {
      review_count: Number(sellerStats.review_count),
      avg_rating: +(+sellerStats.avg_rating).toFixed(1),
      listing_count: Number(sellerStats.listing_count),
    },
  });
});

router.post('/', requireAuth, (req, res) => {
  const {
    title, description, hair_type, texture, color, length_cm, weight_grams,
    price_cents, currency, photos,
  } = req.body || {};
  if (!title || !price_cents) {
    return res.status(400).json({ error: 'Title and price are required.' });
  }
  const cleanPhotos = Array.isArray(photos)
    ? photos.filter((p) => typeof p === 'string' && /^https?:\/\//.test(p)).slice(0, 8)
    : [];
  const info = db.prepare(
    `INSERT INTO hair_listings (seller_id, title, description, hair_type, texture, color, length_cm, weight_grams, price_cents, currency, photos)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    req.userId, String(title).trim().slice(0, 160), String(description || '').trim().slice(0, 4000),
    String(hair_type || 'Virgin Hair').slice(0, 60), String(texture || 'Silky Straight').slice(0, 60),
    String(color || 'Black').slice(0, 40), length_cm ? Number(length_cm) : null,
    weight_grams ? Number(weight_grams) : null, Number(price_cents), String(currency || 'usd'),
    JSON.stringify(cleanPhotos)
  );
  const row = db.prepare(`${listingSelect(req.userId)} WHERE l.id = ?`).get(info.lastInsertRowid);
  res.status(201).json({ listing: mapListing(row, req.userId) });
});

router.post('/:id/comments', requireAuth, (req, res) => {
  const { body } = req.body || {};
  if (!body || !String(body).trim()) return res.status(400).json({ error: 'Comment cannot be empty.' });
  const listing = db.prepare('SELECT id FROM hair_listings WHERE id = ?').get(Number(req.params.id));
  if (!listing) return res.status(404).json({ error: 'Listing not found.' });
  const info = db.prepare(
    'INSERT INTO listing_comments (user_id, listing_id, body) VALUES (?, ?, ?)'
  ).run(req.userId, listing.id, String(body).trim().slice(0, 2000));
  const user = db.prepare('SELECT name, avatar_url FROM users WHERE id = ?').get(req.userId);
  res.status(201).json({
    id: Number(info.lastInsertRowid),
    body: String(body).trim().slice(0, 2000),
    created_at: db.prepare('SELECT created_at FROM listing_comments WHERE id = ?').get(info.lastInsertRowid).created_at,
    user_name: user.name,
    user_avatar: user.avatar_url,
  });
});

router.delete('/:id/comments/:cid', requireAuth, (req, res) => {
  const comment = db.prepare('SELECT * FROM listing_comments WHERE id = ?').get(Number(req.params.cid));
  if (!comment) return res.status(404).json({ error: 'Comment not found.' });
  const user = db.prepare('SELECT role FROM users WHERE id = ?').get(req.userId);
  if (comment.user_id !== req.userId && user.role !== 'admin') return res.status(403).json({ error: 'Not allowed.' });
  db.prepare('DELETE FROM listing_comments WHERE id = ?').run(comment.id);
  res.json({ ok: true });
});

router.post('/:id/interest', requireAuth, (req, res) => {
  const listing = db.prepare('SELECT id FROM hair_listings WHERE id = ?').get(Number(req.params.id));
  if (!listing) return res.status(404).json({ error: 'Listing not found.' });
  try {
    db.prepare('INSERT INTO listing_interests (user_id, listing_id) VALUES (?, ?)').run(req.userId, listing.id);
  } catch { /* already interested */ }
  const count = db.prepare('SELECT COUNT(*) AS n FROM listing_interests WHERE listing_id = ?').get(listing.id).n;
  res.json({ interested: true, interest_count: Number(count) });
});

router.delete('/:id/interest', requireAuth, (req, res) => {
  const listing = db.prepare('SELECT id FROM hair_listings WHERE id = ?').get(Number(req.params.id));
  if (!listing) return res.status(404).json({ error: 'Listing not found.' });
  db.prepare('DELETE FROM listing_interests WHERE user_id = ? AND listing_id = ?').run(req.userId, listing.id);
  const count = db.prepare('SELECT COUNT(*) AS n FROM listing_interests WHERE listing_id = ?').get(listing.id).n;
  res.json({ interested: false, interest_count: Number(count) });
});

router.patch('/:id/status', requireAuth, (req, res) => {
  const { status } = req.body || {};
  if (!['active', 'sold', 'removed'].includes(status)) return res.status(400).json({ error: 'Invalid status.' });
  const listing = db.prepare('SELECT * FROM hair_listings WHERE id = ?').get(Number(req.params.id));
  if (!listing) return res.status(404).json({ error: 'Listing not found.' });
  const user = db.prepare('SELECT role FROM users WHERE id = ?').get(req.userId);
  if (listing.seller_id !== req.userId && user.role !== 'admin') return res.status(403).json({ error: 'Not allowed.' });
  db.prepare('UPDATE hair_listings SET status = ?, updated_at = datetime(\'now\') WHERE id = ?').run(status, listing.id);
  res.json({ ok: true });
});

router.post('/:id/reviews', requireAuth, (req, res) => {
  const { rating, body } = req.body || {};
  const r = Number(rating);
  if (!r || r < 1 || r > 5) return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
  const listing = db.prepare('SELECT * FROM hair_listings WHERE id = ?').get(Number(req.params.id));
  if (!listing) return res.status(404).json({ error: 'Listing not found.' });
  if (listing.seller_id === req.userId) return res.status(400).json({ error: 'You cannot review your own listing.' });
  const info = db.prepare(
    'INSERT INTO reviews (user_id, listing_id, seller_id, rating, body) VALUES (?, ?, ?, ?, ?)'
  ).run(req.userId, listing.id, listing.seller_id, r, String(body || '').trim().slice(0, 1000));
  res.status(201).json({ ok: true, review_id: Number(info.lastInsertRowid) });
});

module.exports = router;
