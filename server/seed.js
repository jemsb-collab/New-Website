'use strict';

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('./db');

const FORCE = process.env.FORCE === '1';

function count(sql, ...p) {
  return Number(db.prepare(sql).get(...p).n);
}

function loadPhotos() {
  const file = path.join(__dirname, 'data', 'hair_photos.json');
  if (!fs.existsSync(file)) {
    console.error('[seed] missing server/data/hair_photos.json — run: node server/scripts/scrape-hair.js');
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(file));
}

const CATEGORIES = [
  { slug: 'long-silky-hair', name: 'Long Silky Hair', description: 'Glass-smooth, waist-length shine. The silk press standard.' },
  { slug: 'bob', name: 'Bob', description: 'Precision bob cuts — blunt, graduated and everything between.' },
  { slug: 'short-bob', name: 'Short Bob', description: 'Clean and chic, just above the shoulders.' },
  { slug: 'half-headshave', name: 'Half Headshave', description: 'Bold undercut contrast — one side shaved, one side kept.' },
  { slug: 'full-headshave', name: 'Full Headshave', description: 'Confident, sculptural and skin-smooth.' },
  { slug: 'very-long-hair', name: 'Very Long Hair', description: 'Maximum length, maximum drama.' },
  { slug: 'asian-hair', name: 'Asian Hair', description: 'Asian-American hair culture, textures and styles.' },
  { slug: 'russian-hair', name: 'Russian Hair', description: 'The gold standard of extension-grade hair.' },
  { slug: 'black-hair', name: 'Black Hair', description: 'Natural textures, protective styles and healthy routines.' },
  { slug: 'brown-hair', name: 'Brown Hair', description: 'Warm brunette tones and everyday styling.' },
  { slug: 'chinese-hair', name: 'Chinese Hair', description: 'Chinese hair textures, treatments and long-hair care.' },
];

const SELLERS = [
  'Lena', 'Mara', 'Aisha', 'Priya', 'Noor', 'Svetlana', 'Mei', 'Yara',
  'Camille', 'Tanya', 'Isla', 'Fatima', 'Rosie', 'Anastasia',
];

const POSTS_PER_CATEGORY = 50;

function cleanTitle(t) {
  return t
    .replace(/#\S+/g, '')
    .replace(/[\u{1F300}-\u{1FAFF}\u{1F000}-\u{1F0FF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\s+/g, ' ')
    .replace(/["“”]/g, '')
    .replace(/[.!?,;:]+$/, '')
    .trim()
    .slice(0, 90);
}

const DESCS = [
  'A studio favourite — clear, honest technique with zero filler. Watch, note the product list, and try it on your own texture.',
  'The FM editorial team picked this one for its clean sectioning and real, unedited result.',
  'Shot on real hair, by real stylists. This is the kind of tutorial you actually finish.',
  'Popular with the community for its calm pacing and repeatable result. Bookmark it for next wash day.',
  'Detailed, unpretentious and practical. Exactly what Filora Media stands for.',
];

const BUY_COMMENTS = [
  'Hi! Is this still available? I want it — can you ship to Europe?',
  'Interested! What’s the exact length and weight?',
  'Gorgeous. How many bundles and how much shedding?',
  'I’ll take this if it’s still up. DM me details please!',
  'Would you do 4 bundles for a slightly better price?',
  'Is the colour true to the photo? I’m ready to buy today.',
  'Very interested — how does it hold up after a few washes?',
  'Buying this for my wedding hair, please hold it for me!',
];

const REVIEWS = [
  [5, 'Hair arrived exactly as pictured — silky and full. Will definitely buy again.'],
  [5, 'Amazing quality, shipped fast, zero shedding. Thank you!'],
  [5, 'Gorgeous bundles, the texture is unreal. Highly recommend this seller.'],
  [5, 'Perfect match to the description. My stylist was impressed.'],
  [4, 'Really great hair, beautiful shine. Shipping took a few extra days but worth it.'],
  [4, 'Lovely quality for the price. Would order again, maybe one more bundle next time.'],
  [4, 'Happy with the purchase! Colour was slightly different to the photos but still beautiful.'],
  [4, 'Very good hair, tangles a little at the ends but styles wonderfully.'],
  [3, 'Good hair overall, sheds a little but the length and texture are exactly as described. Recommended for the price.'],
  [3, 'Decent quality, needed some extra conditioning but I am very happy with the final result. Would buy again.'],
  [3, 'Solid buy. The shine is not quite like the pictures but it styles beautifully. Still recommend.'],
];

const CHALLENGES = [
  { title: '30-Day Silk Hair Streak', days: 30, goal: 'Daily silk press or satin bedtime routine, plus a weekly deep-conditioning mask. Track 2cm of new growth.', cat: 'long-silky-hair', pool: 'long-silky-hair' },
  { title: 'The Blunt Bob Project', days: 21, goal: 'Commit to the blunt bob. One length, zero layers, gloss finish. Post your week-by-week progress.', cat: 'bob', pool: 'bob' },
  { title: 'Headshave Courage', days: 60, goal: 'Join the shave. From half-shave to full — document the transformation and your scalp-care routine.', cat: 'half-headshave', pool: 'full-headshave' },
  { title: '2cm in 60', days: 60, goal: 'A growth sprint. Oils, scalp massage, protective styles — prove the 2cm.', cat: 'very-long-hair', pool: 'very-long-hair' },
  { title: 'Texture Recovery', days: 30, goal: 'Bring your natural texture back to life — no heat, weekly treatments, progress photos.', cat: 'black-hair', pool: 'black-hair' },
];

function seed() {
  if (!FORCE && count('SELECT COUNT(*) AS n FROM posts') > 0) {
    console.log('[seed] data already exists — use FORCE=1 to reseed from scratch.');
    return;
  }

  const photos = loadPhotos();
  db.reset();
  db.exec('BEGIN');

  const pw = bcrypt.hashSync('password123', 10);
  const users = [];
  const mkUser = (name, email, role = 'viewer') => {
    const info = db.prepare('INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)')
      .run(email, pw, name, role);
    const u = { id: Number(info.lastInsertRowid), name };
    users.push(u);
    return u;
  };
  mkUser('Filora Studio', 'admin@filora.media', 'admin');
  SELLERS.forEach((n, i) => mkUser(n, `seller${i + 1}@filora.media`));

  const catIds = {};
  CATEGORIES.forEach((c) => {
    const info = db.prepare('INSERT INTO categories (slug, name, description) VALUES (?, ?, ?)')
      .run(c.slug, c.name, c.description);
    catIds[c.slug] = Number(info.lastInsertRowid);
  });

  const viewers = users.filter((u) => u.name !== 'Filora Studio');
  const rand = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
  const pick = (arr) => arr[rand(0, arr.length - 1)];
  const iso = (daysAgo, hoursOffset = 0) =>
    new Date(Date.now() - daysAgo * 86400000 - hoursOffset * 3600000)
      .toISOString().replace('T', ' ').slice(0, 19);

  /* ---------- Posts ---------- */
  let totalPosts = 0;
  CATEGORIES.forEach((cat) => {
    const vids = photos[cat.slug].videos.slice(0, POSTS_PER_CATEGORY);
    vids.forEach((v, idx) => {
      const title = cleanTitle(v.title) || `${cat.name} styling — studio pick`;
      const views = rand(2000, 90000);
      const isPremium = idx % 9 === 0;
      const created = iso(Math.floor(idx / 4), rand(0, 20));
      const info = db.prepare(
        `INSERT INTO posts (title, description, category_id, created_by, youtube_link, thumbnail_url,
           view_count, is_premium, price_cents, is_published, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`
      ).run(
        title,
        `${pick(DESCS)}\n\nThis ${cat.name.toLowerCase()} entry streams from the creator's channel. FM members get the full-length cut plus the product list.`,
        catIds[cat.slug],
        users[0].id,
        `https://www.youtube.com/watch?v=${v.id}`,
        `https://img.youtube.com/vi/${v.id}/hqdefault.jpg`,
        views,
        isPremium ? 1 : 0,
        isPremium ? rand(499, 1499) : null,
        created
      );
      const postId = Number(info.lastInsertRowid);
      totalPosts++;

      const nLikes = rand(3, 10);
      for (let k = 0; k < nLikes; k++) {
        db.prepare('INSERT OR IGNORE INTO likes (user_id, post_id) VALUES (?, ?)')
          .run(pick(viewers).id, postId);
      }
      const nComments = rand(0, 4);
      for (let k = 0; k < nComments; k++) {
        db.prepare('INSERT INTO comments (user_id, post_id, body, created_at) VALUES (?, ?, ?, ?)')
          .run(pick(viewers).id, postId, pick([
            'Tried this tonight and it held all day. Thank you!',
            'The product tip changed everything for me.',
            'Finally a version I can actually follow.',
            'This is the one I keep coming back to. So clean.',
            'The sectioning detail is exactly what I was missing.',
            'My hair is shorter than hers but the technique still worked.',
            'Saved this for my next wash day.',
            'Showed my stylist and she said it was spot on.',
          ]), iso(rand(1, 12)));
      }
    });
  });
  console.log(`[seed] ${totalPosts} posts`);

  /* ---------- Marketplace ---------- */
  const listingSpecs = [
    { title: '22" Virgin Silky Straight Bundle', type: 'Virgin Hair', texture: 'Silky Straight', color: 'Black', len: 55, wt: 100, price: 249, pool: 'long-silky-hair' },
    { title: '18" Remy Body Wave — 4 bundles', type: 'Remy Hair', texture: 'Body Wave', color: 'Black', len: 46, wt: 200, price: 329, pool: 'long-silky-hair' },
    { title: 'Russian Blonde 24" Weft', type: 'Russian Hair', texture: 'Silky Straight', color: 'Blonde', len: 61, wt: 120, price: 419, pool: 'russian-hair' },
    { title: 'Natural Black 16" Closure + Bundles', type: 'Human Hair', texture: 'Kinky Straight', color: 'Black', len: 41, wt: 160, price: 289, pool: 'black-hair' },
    { title: 'Silky 20" 5x5 Closure Set', type: 'Virgin Hair', texture: 'Silky Straight', color: 'Dark Brown', len: 51, wt: 150, price: 359, pool: 'long-silky-hair' },
    { title: 'Deep Wave 14" Bundle', type: 'Human Hair', texture: 'Deep Wave', color: 'Black', len: 36, wt: 100, price: 199, pool: 'black-hair' },
    { title: 'Chinese Straight 26" Premium Weft', type: 'Chinese Hair', texture: 'Silky Straight', color: 'Black', len: 66, wt: 130, price: 389, pool: 'chinese-hair' },
    { title: 'Brown Silk 12" Bob Cut Unit', type: 'Human Hair', texture: 'Silky Straight', color: 'Brown', len: 30, wt: 80, price: 169, pool: 'brown-hair' },
    { title: 'Strawberry Blonde 20" Remy', type: 'Remy Hair', texture: 'Body Wave', color: 'Strawberry Blonde', len: 51, wt: 110, price: 299, pool: 'russian-hair' },
    { title: 'Jet Black 22" Kinky Straight Bundle', type: 'Virgin Hair', texture: 'Kinky Straight', color: 'Black', len: 55, wt: 110, price: 279, pool: 'black-hair' },
    { title: '22" Silk Press Bundle — 3pc', type: 'Human Hair', texture: 'Silky Straight', color: 'Brown', len: 55, wt: 140, price: 319, pool: 'brown-hair' },
    { title: 'Half-Shave Edge Kit — custom', type: 'Synthetic', texture: 'Curly', color: 'Black', len: 20, wt: 60, price: 89, pool: 'half-headshave' },
    { title: 'Ultra Long 30" Straight Weft', type: 'Virgin Hair', texture: 'Silky Straight', color: 'Black', len: 76, wt: 180, price: 499, pool: 'very-long-hair' },
    { title: 'Blunt Bob 10" Gloss Unit', type: 'Human Hair', texture: 'Silky Straight', color: 'Dark Brown', len: 25, wt: 70, price: 149, pool: 'bob' },
    { title: 'Chocolate Brown 18" Remy Closure', type: 'Remy Hair', texture: 'Silky Straight', color: 'Chocolate Brown', len: 46, wt: 90, price: 209, pool: 'brown-hair' },
    { title: 'Natural Black Deep Wave 24"', type: 'Virgin Hair', texture: 'Deep Wave', color: 'Black', len: 61, wt: 200, price: 369, pool: 'black-hair' },
    { title: 'Ash Blonde Balayage 20" Weft', type: 'Human Hair', texture: 'Body Wave', color: 'Ash Blonde', len: 51, wt: 110, price: 329, pool: 'russian-hair' },
    { title: 'Jet Black Silk Straight 18" Bundle', type: 'Chinese Hair', texture: 'Silky Straight', color: 'Jet Black', len: 46, wt: 100, price: 229, pool: 'chinese-hair' },
    { title: 'Soft Black 20" 13x4 Frontal', type: 'Human Hair', texture: 'Kinky Straight', color: 'Black', len: 51, wt: 95, price: 259, pool: 'black-hair' },
    { title: 'Platinum Blonde 16" Closure', type: 'Remy Hair', texture: 'Silky Straight', color: 'Platinum Blonde', len: 41, wt: 85, price: 239, pool: 'russian-hair' },
    { title: 'Very Long 28" Silk Bundle — 4pc', type: 'Virgin Hair', texture: 'Silky Straight', color: 'Black', len: 71, wt: 220, price: 459, pool: 'very-long-hair' },
    { title: 'Brown Silk Bob 12" Ready-To-Wear', type: 'Human Hair', texture: 'Silky Straight', color: 'Brown', len: 30, wt: 75, price: 159, pool: 'bob' },
    { title: 'Raven Black 14" Deep Wave Bundle', type: 'Human Hair', texture: 'Deep Wave', color: 'Raven Black', len: 36, wt: 100, price: 189, pool: 'black-hair' },
    { title: 'Honey Brown 22" Remy Weft', type: 'Remy Hair', texture: 'Body Wave', color: 'Honey Brown', len: 55, wt: 120, price: 289, pool: 'brown-hair' },
    { title: 'Chinese Virgin 24" Straight — 3 bundles', type: 'Chinese Hair', texture: 'Silky Straight', color: 'Black', len: 61, wt: 150, price: 349, pool: 'chinese-hair' },
    { title: 'Silky Straight 20" Half-Set', type: 'Human Hair', texture: 'Silky Straight', color: 'Black', len: 51, wt: 90, price: 219, pool: 'long-silky-hair' },
    { title: 'Curly 12" Pixie Unit', type: 'Synthetic', texture: 'Curly', color: 'Black', len: 30, wt: 55, price: 79, pool: 'black-hair' },
    { title: 'Balayage Brown 24" Silk Weft', type: 'Human Hair', texture: 'Silky Straight', color: 'Balayage Brown', len: 61, wt: 130, price: 339, pool: 'brown-hair' },
    { title: 'Jet Black 10" Short Bob Unit', type: 'Human Hair', texture: 'Silky Straight', color: 'Jet Black', len: 25, wt: 60, price: 129, pool: 'bob' },
    { title: 'Russian 26" Raw Hair Weft', type: 'Russian Hair', texture: 'Silky Straight', color: 'Blonde', len: 66, wt: 140, price: 449, pool: 'russian-hair' },
    { title: 'Silky Black 20" 4x4 Closure', type: 'Virgin Hair', texture: 'Silky Straight', color: 'Black', len: 51, wt: 105, price: 269, pool: 'long-silky-hair' },
    { title: 'Naturale 18" Kinky Curly Set', type: 'Human Hair', texture: 'Curly', color: 'Black', len: 46, wt: 160, price: 309, pool: 'black-hair' },
    { title: 'Espresso 14" Bob Wig Unit', type: 'Human Hair', texture: 'Silky Straight', color: 'Espresso', len: 36, wt: 70, price: 179, pool: 'bob' },
    { title: 'Long Silk 26" Single Bundle', type: 'Virgin Hair', texture: 'Silky Straight', color: 'Black', len: 66, wt: 110, price: 299, pool: 'long-silky-hair' },
  ];

  let listingCount = 0;
  listingSpecs.forEach((spec, i) => {
    const seller = viewers[rand(0, viewers.length - 1)];
    const pool = photos[spec.pool].videos;
    const photoCount = rand(2, 4);
    const photosList = [];
    for (let k = 0; k < photoCount; k++) {
      const v = pool[(i + k * 7) % pool.length];
      photosList.push(`https://img.youtube.com/vi/${v.id}/hqdefault.jpg`);
    }
    const status = i % 6 === 0 ? 'sold' : 'active';
    const info = db.prepare(
      `INSERT INTO hair_listings (seller_id, title, description, hair_type, texture, color, length_cm, weight_grams, price_cents, photos, status, view_count, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      seller.id,
      spec.title,
      `${spec.type} ${spec.texture.toLowerCase()} hair, ${spec.color.toLowerCase()}.\n\n100% of the proceeds go to the seller. Verified by the FM community — check the reviews below before you buy. Buyers, comment on the ad to claim the hair.`,
      spec.type, spec.texture, spec.color, spec.len, spec.wt, spec.price,
      JSON.stringify(photosList), status, rand(300, 40000), iso(rand(0, 20), rand(0, 12))
    );
    const listingId = Number(info.lastInsertRowid);
    listingCount++;

    if (status === 'sold') {
      db.prepare('INSERT INTO listing_comments (user_id, listing_id, body, created_at) VALUES (?, ?, ?, ?)')
        .run(pick(viewers).id, listingId, 'SOLD — thank you everyone for the interest!', iso(rand(1, 4)));
    }

    const nComments = rand(1, 4);
    for (let k = 0; k < nComments; k++) {
      db.prepare('INSERT INTO listing_comments (user_id, listing_id, body, created_at) VALUES (?, ?, ?, ?)')
        .run(pick(viewers).id, listingId, pick(BUY_COMMENTS), iso(rand(0, 10), rand(0, 10)));
    }

    const nInterests = rand(0, 8);
    for (let k = 0; k < nInterests; k++) {
      db.prepare('INSERT OR IGNORE INTO listing_interests (user_id, listing_id) VALUES (?, ?)')
        .run(pick(viewers).id, listingId);
    }

    const nReviews = rand(2, 4);
    for (let k = 0; k < nReviews; k++) {
      const [rating, body] = pick(REVIEWS);
      db.prepare('INSERT INTO reviews (user_id, listing_id, seller_id, rating, body, created_at) VALUES (?, ?, ?, ?, ?, ?)')
        .run(pick(viewers).id, listingId, seller.id, rating, body, iso(rand(1, 15)));
    }
  });
  console.log(`[seed] ${listingCount} marketplace listings`);

  /* ---------- AI looks ---------- */
  const AI_TITLES = [
    ['Silk bob, glass finish', 'bob'], ['Midnight straight — AI concept', 'long-silky-hair'],
    ['The sculpted shave', 'full-headshave'], ['Half-shave asymmetry', 'half-headshave'],
    ['Waist-length silk curtain', 'very-long-hair'], ['Blunt fringe energy', 'bob'],
    ['Ash-blonde soft wave', 'russian-hair'], ['Raven black gloss', 'chinese-hair'],
    ['Chocolate silk layers', 'brown-hair'], ['Natural coils, defined', 'black-hair'],
    ['Korean air curl', 'asian-hair'], ['Edgy short crop', 'short-bob'],
    ['Platinum silk press', 'russian-hair'], ['Glass straight, zero frizz', 'long-silky-hair'],
    ['The graduated bob, AI', 'bob'], ['Confident full shave', 'full-headshave'],
    ['Half-shave with braid', 'half-headshave'], ['Hair to the hips', 'very-long-hair'],
    ['Straight black silk', 'chinese-hair'], ['Soft honey brown', 'brown-hair'],
    ['Bantu-knot inspired', 'black-hair'], ['Bouncy AI blowout', 'long-silky-hair'],
    ['Minimal short bob', 'short-bob'], ['Raven undercut', 'half-headshave'],
  ];
  AI_TITLES.forEach(([title, slug], i) => {
    const v = photos[slug].videos[i % photos[slug].videos.length];
    const info = db.prepare(
      'INSERT INTO ai_looks (title, category_id, image_url, prompt, created_by, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(
      title, catIds[slug], `https://img.youtube.com/vi/${v.id}/hqdefault.jpg`,
      `AI hair concept: ${title.toLowerCase()}.`, users[0].id, 'approved', iso(rand(0, 10), rand(0, 10))
    );
    const lookId = Number(info.lastInsertRowid);
    for (let k = 0; k < rand(1, 6); k++) {
      db.prepare('INSERT OR IGNORE INTO ai_look_likes (user_id, look_id) VALUES (?, ?)')
        .run(pick(viewers).id, lookId);
    }
  });
  console.log(`[seed] ${AI_TITLES.length} AI looks`);

  /* ---------- Challenges ---------- */
  CHALLENGES.forEach((ch) => {
    const v = photos[ch.pool].videos[rand(0, photos[ch.pool].videos.length - 1)];
    const info = db.prepare(
      `INSERT INTO challenges (title, description, duration_days, goal, image_url, category_id, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      ch.title,
      `${ch.goal} Join the streak, post your progress and let the community keep you accountable.`,
      ch.days, ch.goal, `https://img.youtube.com/vi/${v.id}/hqdefault.jpg`, catIds[ch.cat], users[0].id, iso(rand(3, 20))
    );
    const chId = Number(info.lastInsertRowid);
    const participants = viewers.slice(0, rand(3, viewers.length));
    for (const p of participants) {
      db.prepare('INSERT OR IGNORE INTO challenge_participants (user_id, challenge_id, joined_at) VALUES (?, ?, ?)')
        .run(p.id, chId, iso(rand(0, 8)));
    }
    const nUpdates = rand(2, 8);
    for (let k = 0; k < nUpdates; k++) {
      const p = pick(participants);
      db.prepare('INSERT INTO challenge_updates (user_id, challenge_id, body, image_url, created_at) VALUES (?, ?, ?, ?, ?)')
        .run(p.id, chId, pick([
          'Day 12 — 1.5cm of growth, no heat, weekly mask. So happy!',
          'Almost gave up on day 7 but the comments kept me going. Worth it!',
          'Silk routine locked in. My ends have never looked healthier.',
          'Week 3 update — the texture change is real, highly recommend.',
          'Just posted my before/after. The difference is unreal.',
        ]), `https://img.youtube.com/vi/${photos[ch.pool].videos[rand(0, 4)].id}/hqdefault.jpg`, iso(rand(0, 6)));
    }
  });
  console.log(`[seed] ${CHALLENGES.length} challenges`);

  /* ---------- Follows + saves ---------- */
  CATEGORIES.forEach((cat, i) => {
    for (let k = 0; k < rand(2, 6); k++) {
      db.prepare('INSERT OR IGNORE INTO category_follows (user_id, category_id) VALUES (?, ?)')
        .run(pick(viewers).id, catIds[cat.slug]);
    }
  });
  for (let i = 0; i < 40; i++) {
    const postId = rand(1, totalPosts);
    db.prepare('INSERT OR IGNORE INTO saves (user_id, post_id) VALUES (?, ?)')
      .run(pick(viewers).id, postId);
  }

  db.exec('COMMIT');
  console.log('[seed] done.');
  console.log('[seed] admin login: admin@filora.media / password123');
  console.log('[seed] demo viewer: seller1@filora.media / password123');
}

seed();
