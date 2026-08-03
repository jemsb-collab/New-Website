'use strict';

const bcrypt = require('bcryptjs');
const db = require('./db');

function count(sql, ...p) {
  return Number(db.prepare(sql).get(...p).n);
}

const CATEGORIES = [
  { slug: 'long-hair', name: 'Long Hair', description: 'Updos, braids, claw-clip styling and everyday looks for long lengths.' },
  { slug: 'short-hair', name: 'Short Hair', description: 'Sleek ponies, buns and pin-ups made for short cuts.' },
  { slug: 'bald', name: 'Bald', description: 'Scalp care, shaving routines and confidently rocking the shaved head.' },
  { slug: 'perm', name: 'Perm', description: 'Korean perms, rod sets and bouncy, low-maintenance waves.' },
  { slug: 'bob', name: 'Bob', description: 'Precision bob cuts — from blunt one-length to graduated and asymmetrical.' },
  { slug: 'curly-hair', name: 'Curly Hair', description: 'Defined ringlets, routines and heatless curl techniques.' },
  { slug: 'braids', name: 'Braids', description: 'Box braids, cornrows, Dutch braids and everything in between.' },
];

const POSTS = [
  { slug: 'long-hair', id: '11v4VNZbg0c', title: 'The Lived-In Wave: an Effortless Everyday Hairstyle for Long Hair', desc: 'A soft, piecey wave built on damp hair and a claw clip — no heat, no fuss. The studio favourite for long lengths.' },
  { slug: 'long-hair', id: '1c_gHonRtYI', title: '60-Second French Twist Updo', desc: 'A polished French twist in under a minute. Ideal for evenings out, interviews or when you simply refuse to fight with a bun.' },
  { slug: 'long-hair', id: '7G_sfJ719sM', title: 'The Beginner Updo: Medium & Long Hair', desc: 'The one updo you will actually remember. Works on medium and long hair alike, holds all day, and looks expensive.' },
  { slug: 'long-hair', id: 'AL1TaLl-2Ns', title: 'Working With Wet Hair: a Healthy-Hair Tutorial', desc: 'Styling damp hair the right way — products, timing and technique that protect the cuticle while you build the look.' },
  { slug: 'long-hair', id: 'BJXY0qphbGA', title: 'The Modern Man Bun', desc: 'A clean, structured man bun with zero awkward loops. Step-by-step gathering, smoothing and securing.' },
  { slug: 'long-hair', id: 'BfGwTFcS5PM', title: 'Claw Clip, Mastered', desc: 'Three different claw-clip placements that transform a plain ponytail into an editorial silhouette.' },

  { slug: 'short-hair', id: '-q2N35aEfXM', title: 'French Hair Pins on Short Hair', desc: 'Tiny pins, big payoff. How to anchor french pins into short layers so they stay put through a full workday.' },
  { slug: 'short-hair', id: '53y9wVUjNo4', title: 'The Sleek Pony for Short Hair', desc: 'A glossy, taut sleek pony on a bob — smoothing technique and the products that stop flyaways before they start.' },
  { slug: 'short-hair', id: '7jD2RlHGkso', title: 'Easy Buns for Short Hair', desc: 'Three quick bun variations for short hair that read as intentional, not accidental.' },
  { slug: 'short-hair', id: '8ESkNyc9d4w', title: 'Twin Braids on Short Hair', desc: 'A soft twin-braid look for shoulder-grazing cuts. The parting does the heavy lifting.' },
  { slug: 'short-hair', id: 'Flu9mhLMmyc', title: 'How to Style Short Hair — Pt. 4', desc: 'The final chapter of the short-hair series: texture, root lift and the tousle that makes it look effortless.' },
  { slug: 'short-hair', id: 'H8LofdQ5hEs', title: 'Short Hair, Big Mood', desc: 'A moodboard-style look at what a good short cut can carry — accessories, texture and attitude.' },

  { slug: 'bald', id: '-iqffgPSe2g', title: 'Scalp Care & Bald Head Mastery', desc: 'Precision shaving, moisturising and sun protection — the full protocol for a head that is looked after, not just shaved.' },
  { slug: 'bald', id: '6XCWt_jvBbQ', title: 'The Best Way to Shave Your Head', desc: 'Grain direction, blade choice and post-shave care. A calm, methodical walk-through for a smooth result every time.' },
  { slug: 'bald', id: '8Xm_qqFb_L0', title: 'Shave Your Head Bald With a Razor, First Try', desc: 'For first-timers: how to razor-shave a full head without nicks, irritation or regret. Includes prep and cleanup.' },
  { slug: 'bald', id: 'B0AtOROKeJg', title: '5-Day Stubble Routine for Coarse Hair', desc: 'Maintaining a 5-day shadow — clipper setting, exfoliation schedule and moisturising for coarse, curly hair.' },
  { slug: 'bald', id: 'BYp9PFtGxlg', title: 'How to Properly Rock a Bald Head', desc: 'Styling, grooming and confidence. Why the shaved head works, and how to make it read as a choice.' },
  { slug: 'bald', id: 'EUJR22RMnUg', title: 'Don’t Neglect Your Bald Head', desc: 'The products and habits that keep a shaved scalp hydrated, healthy and sun-safe all year round.' },

  { slug: 'perm', id: '3tMSYPPPDxc', title: 'Easy Home Perm — Beginner Friendly', desc: 'A patient, voice-led walk-through of a simple home perm. Rod selection, timing and neutralising done right.' },
  { slug: 'perm', id: '4Qf4rDvVSXw', title: 'Perming Short Hair', desc: 'Adding curl to a short crop — rod sizes for tighter definition and what to expect in the first 48 hours.' },
  { slug: 'perm', id: '5Ue9DSwCx5s', title: 'Spiral Perm, Part 2', desc: 'The second half of a permanent spiral — finishing, drying and styling the coils so they fall naturally.' },
  { slug: 'perm', id: 'EoeCpwYIy3g', title: 'The Most Low-Maintenance Perm', desc: 'A loose, air-dried wave that needs almost nothing after the salon. The perm for people who hate styling.' },
  { slug: 'perm', id: 'PQHQbGvtjFw', title: 'Perm Rod Set on Short Hair', desc: 'Sectioning and rolling a full rod set on short hair — the technique behind a springy, uniform curl.' },

  { slug: 'bob', id: '28XqOJEfYPQ', title: 'How to Cut the Perfect Bob at Home', desc: 'A considered, step-by-step bob cut you can maintain yourself — sectioning, tension and the all-important fringe.' },
  { slug: 'bob', id: '75OdYNBLEkQ', title: 'The Professional Short Bob', desc: 'A precise short bob from a working stylist — interior cutting, weight lines and a clean, geometric finish.' },
  { slug: 'bob', id: '8cxqc6NU-zQ', title: 'Long-Layered Bob With Volume', desc: 'Cutting long layers into a bob to add movement and lift — a guide to creating volume without a round brush marathon.' },
  { slug: 'bob', id: '9oQ0a_K0cX8', title: 'Asymmetrical Graduated Bob', desc: 'A full graduated bob with an asymmetric edge — mapping the drop and cutting the profile with confidence.' },
  { slug: 'bob', id: 'AgmXG4ES2Rw', title: 'One-Length Bob, Perfected', desc: 'The bluntest, most precise haircut in the repertoire. How to keep one-length true from ear to nape.' },

  { slug: 'curly-hair', id: '0LiM925tWko', title: 'My Curly Hair Routine', desc: 'Shampoo, condition, gel, dry — a complete wash-day routine for defined, soft curls that last until day three.' },
  { slug: 'curly-hair', id: '0n_a5QZ1I5Y', title: 'Bouncy Flat-Iron Curls', desc: 'Using a straightener to build a bouncy curl — the angle, the speed and the cool-down that locks it in.' },
  { slug: 'curly-hair', id: '35eIyneNOuk', title: '547 Days Building a Curly Routine', desc: 'A year and a half of trial and error condensed into one routine — what actually moved the needle on definition.' },
  { slug: 'curly-hair', id: '42QJDG59wD8', title: 'Ringlets, Defined', desc: 'The technique for the most defined ringlets — raking, brushing and praying hands, and which gel wins.' },
  { slug: 'curly-hair', id: '5KHzvS5GgMs', title: 'Curly Blowout With the Airwrap', desc: 'A bouncy, glossy blowout on naturally curly hair. Attachment order and tension for salon movement.' },

  { slug: 'braids', id: '4g-ghBar3Ec', title: 'Detailed Cornrow Tutorial for Beginners', desc: 'A gentle, step-by-step cornrow tutorial with clear hand placement — the one to start with if you are brand new.' },
  { slug: 'braids', id: '8NETsiwNBlA', title: 'The Braid That Comes Out Perfect', desc: 'A braid pattern that lands cleanly every time — tension control and the finishing that makes it look done.' },
  { slug: 'braids', id: 'bVk0G-TQPEE', title: 'Dutch Braid Your Own Hair — Full Talk-Through', desc: 'Dutch braids on your own head, fully explained. Overhand, underhand and where the frustration points live.' },
  { slug: 'braids', id: 'xErLbKgsAxk', title: 'Trending Stitch Braid Style', desc: 'A stitch-braid look pulled from the current trend cycle — parting, tension and the crisp three-dimensional finish.' },
  { slug: 'braids', id: 'birCPzu3v3U', title: 'Perfect Parts for Box Braids', desc: 'The parting is the whole game. A detailed guide to clean, even sections that make box braids look professional.' },
];

const COMMENTS = [
  'Tried this tonight and it actually held all day. Thank you!',
  'The product tip changed everything for me.',
  'Been waiting for this one — finally a version I can follow.',
  'Went to the mirror halfway through and finished the look. Wild.',
  'So clean. The sectioning detail is exactly what I was missing.',
  'Saved this for my next wash day.',
  'My hair is shorter than hers but the technique still worked.',
  'The calm pace of this tutorial is so refreshing.',
  'Showed my stylist this and she said it was spot on.',
  'Third time watching, finally got the hang of it.',
];

const USER_NAMES = ['Mara', 'Julien', 'Aisha', 'Theo', 'Lena', 'Ravi', 'Noor', 'Diego', 'Priya', 'Mika'];

function seed() {
  if (count('SELECT COUNT(*) AS n FROM posts') > 0) {
    console.log('[seed] posts already exist — skipping. Run with FORCE=1 to reseed from scratch.');
    return;
  }

  db.exec('BEGIN');

  const pwHash = bcrypt.hashSync('password123', 10);
  const users = [];
  const mkUser = (name, email, role = 'viewer') => {
    const info = db.prepare(
      'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)'
    ).run(email, pwHash, name, role);
    const u = { id: Number(info.lastInsertRowid), name };
    users.push(u);
    return u;
  };
  mkUser('Admin', 'admin@filora.media', 'admin');
  USER_NAMES.forEach((n, i) => mkUser(n, `demo${i + 1}@filora.media`));

  const catIds = {};
  CATEGORIES.forEach((c, i) => {
    const info = db.prepare(
      'INSERT INTO categories (slug, name, description) VALUES (?, ?, ?)'
    ).run(c.slug, c.name, c.description);
    catIds[c.slug] = Number(info.lastInsertRowid);
  });

  const viewers = users.filter((u) => u.name !== 'Admin');
  const rand = (min, max) => min + Math.floor(Math.random() * (max - min + 1));

  POSTS.forEach((p, idx) => {
    const catId = catIds[p.slug];
    const created = new Date(Date.now() - (POSTS.length - idx) * 2 * 86400000 - rand(0, 20) * 3600000)
      .toISOString().replace('T', ' ').slice(0, 19);
    const views = rand(1200, 64000);
    const isPremium = idx % 7 === 0;
    const info = db.prepare(
      `INSERT INTO posts (title, description, category_id, created_by, youtube_link, telegram_link, drive_link,
         thumbnail_url, view_count, is_premium, price_cents, is_published, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`
    ).run(
      p.title,
      `${p.desc}\n\nFilora Media (FM) is the home of honest hair content — real tutorials, real tools, zero filler. This studio entry streams from the creator's channel. Members of the ${
        isPremium ? 'Signature' : 'Open'} collection get the full-length cut with product lists.`,
      catId,
      users[0].id,
      `https://www.youtube.com/watch?v=${p.id}`,
      idx % 3 === 0 ? 'https://t.me/filora_media' : null,
      idx % 4 === 0 ? 'https://drive.google.com/file/d/1FaBqVYdOwoV_placeholder_filora/view' : null,
      `https://img.youtube.com/vi/${p.id}/hqdefault.jpg`,
      views,
      isPremium ? 1 : 0,
      isPremium ? rand(499, 1499) : null,
      created
    );
    const postId = Number(info.lastInsertRowid);

    db.prepare(
      'INSERT INTO post_images (post_id, image_url, sort_order) VALUES (?, ?, 0)'
    ).run(postId, `https://img.youtube.com/vi/${p.id}/maxresdefault.jpg`);

    const likes = rand(4, Math.min(viewers.length, 10));
    for (const v of viewers.slice(0, likes)) {
      db.prepare('INSERT OR IGNORE INTO likes (user_id, post_id) VALUES (?, ?)').run(v.id, postId);
    }
    if (idx % 2 === 0) {
      db.prepare('INSERT OR IGNORE INTO saves (user_id, post_id) VALUES (?, ?)').run(viewers[0].id, postId);
    }
    const nComments = rand(0, 4);
    for (let c = 0; c < nComments; c++) {
      const author = viewers[rand(0, viewers.length - 1)];
      const ts = new Date(Date.now() - rand(1, 10) * 86400000).toISOString().replace('T', ' ').slice(0, 19);
      db.prepare(
        'INSERT INTO comments (user_id, post_id, body, created_at) VALUES (?, ?, ?, ?)'
      ).run(author.id, postId, COMMENTS[rand(0, COMMENTS.length - 1)], ts);
    }
  });

  CATEGORIES.forEach((c, i) => {
    const followers = viewers.slice(0, rand(1, 6));
    for (const f of followers) {
      db.prepare('INSERT OR IGNORE INTO category_follows (user_id, category_id) VALUES (?, ?)').run(f.id, catIds[c.slug]);
    }
  });

  db.exec('COMMIT');
  console.log(`[seed] done. ${POSTS.length} posts, ${CATEGORIES.length} categories, ${users.length} users.`);
  console.log('[seed] admin login: admin@filora.media / password123');
  console.log('[seed] demo viewer: demo1@filora.media / password123');
}

seed();
