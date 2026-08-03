'use strict';

const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  const comments = db.prepare(
    `SELECT 'comment' AS type, c.id, cm.body AS text, c.name AS user_name, c.avatar_url AS user_avatar,
       c.created_at, NULL AS target_id, cm.post_id AS ref
     FROM comments cm JOIN users c ON c.id = cm.user_id
     ORDER BY cm.created_at DESC LIMIT 10`
  ).all().map((r) => ({ ...r, kind: 'comment', target: `Post #${r.ref}` }));

  const listingComments = db.prepare(
    `SELECT 'buy' AS type, c.id, c.body AS text, u.name AS user_name, u.avatar_url AS user_avatar,
       c.created_at, c.listing_id AS ref
     FROM listing_comments c JOIN users u ON u.id = c.user_id
     ORDER BY c.created_at DESC LIMIT 10`
  ).all().map((r) => ({ ...r, kind: 'buy', target: `Listing #${r.ref}` }));

  const likes = db.prepare(
    `SELECT 'like' AS type, l.id, NULL AS text, u.name AS user_name, u.avatar_url AS user_avatar,
       l.created_at, l.post_id AS ref
     FROM likes l JOIN users u ON u.id = l.user_id
     ORDER BY l.created_at DESC LIMIT 10`
  ).all().map((r) => ({ ...r, kind: 'like', target: `Post #${r.ref}` }));

  const reviews = db.prepare(
    `SELECT 'review' AS type, r.id, r.body AS text, u.name AS user_name, u.avatar_url AS user_avatar,
       r.created_at, r.listing_id AS ref
     FROM reviews r JOIN users u ON u.id = r.user_id
     ORDER BY r.created_at DESC LIMIT 10`
  ).all().map((r) => ({ ...r, kind: 'review', target: `Listing #${r.ref}` }));

  const looks = db.prepare(
    `SELECT 'ai' AS type, a.id, NULL AS text, u.name AS user_name, u.avatar_url AS user_avatar,
       a.created_at, a.id AS ref
     FROM ai_looks a JOIN users u ON u.id = a.created_by
     WHERE a.status = 'approved'
     ORDER BY a.created_at DESC LIMIT 10`
  ).all().map((r) => ({ ...r, kind: 'ai', target: `AI look #${r.ref}` }));

  const all = [...comments, ...listingComments, ...likes, ...reviews, ...looks]
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
    .slice(0, 24);

  res.json({ activity: all });
});

module.exports = router;
