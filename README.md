# Filora Media (FM) — Women's Hair Social Platform

A premium-feeling social platform for women's hair content — long silky hair,
bobs, headshaves, very long hair and more, plus a hair **buy/sell marketplace**
with reviews, community **challenges** and an **AI photo/video studio**.
Built as a media brand: feed, likes, comments, saves, category follows, share,
plus a seller marketplace where buyers comment to claim hair and leave reviews.

> Editorial-studio aesthetic: deep pine `#1F2E28`, warm ivory `#F2EEE3`,
> muted brass `#A9812E`, rust/copper CTA `#9C4B2E`. Fraunces (serif) headings,
> Inter (sans) body, Space Mono (mono) for stats and specs.

## Architecture

- **Backend** — Node.js + Express, SQLite via Node's built-in `node:sqlite`
  (zero native compilation). JWT auth (`bcryptjs`).
- **Frontend** — Vite + React + React Router. Custom CSS design system, no UI kit.
- **Media model** — no self-hosted media storage. Posts only reference **URLs/IDs**:
  - **YouTube** — stored link; embedded player (thumbnail auto-derived).
  - **Telegram** — `t.me/...` link; surfaced as a link-out card (Telegram cannot be embedded).
  - **Google Drive** — file link; embedded via the `/preview` player.
- **Payment-ready schema** — `posts.is_premium`, `posts.price_cents`, plus reserved
  `subscriptions` and `payments` tables. The paywall can be switched on later
  **without a schema rebuild**.

```
client/                 Vite + React SPA
server/
  index.js              Express app (API + serves client/dist in production)
  db.js                 node:sqlite schema (marketplace, challenges, AI looks)
  seed.js               demo seed (550 posts, 34 listings, 24 AI looks, 5 challenges)
  auth.js               JWT helpers
  lib/media.js          YouTube/Telegram/Drive link parsing
  lib/google.js         Google ID-token verification (JWKS)
  routes/               auth, posts, categories, users, marketplace, challenges,
                        ai, activity, admin
  data/hair_photos.json real women's hair videos by category (scraper output)
  scripts/scrape-hair.js curl-based YouTube scraper (women-only, 50+ per category)
```

## Quick start

```bash
npm run setup          # install deps + seed database
npm run dev            # server :3001 + Vite client :5173 (proxies /api)
```

Production-style (single port, served by Express):

```bash
npm run build
npm start              # http://localhost:3001
```

Reseed (drops + recreates the DB from `hair_photos.json`):

```bash
FORCE=1 node server/seed.js
```

## Demo accounts (seeded)

| Role   | Email                       | Password     |
| ------ | --------------------------- | ------------ |
| Admin  | `admin@filora.media`        | `password123` |
| Seller | `seller1@filora.media` … `seller14@filora.media` | `password123` |

Change `JWT_SECRET` and the admin password in production.

## Public API

| Endpoint | Description |
| --- | --- |
| `GET /api/posts` | Feed — `category`, `search`, `sort` (latest/popular/engaged), `limit`, `offset` |
| `GET /api/posts/:id` | Post detail + gallery + comments (increments view count, deduped per minute) |
| `POST/DELETE /api/posts/:id/like` | Like / unlike |
| `POST/DELETE /api/posts/:id/save` | Save / unsave |
| `POST /api/posts/:id/comments` | Comment |
| `GET /api/categories` | Collections with post/follower counts, `is_followed` |
| `POST/DELETE /api/categories/:id/follow` | Follow / unfollow a collection |
| `POST /api/auth/signup` · `POST /api/auth/login` · `GET /api/auth/me` | Accounts |
| `GET /api/users/me/saves` · `me/follows` · `me/stats` | Profile data |
| `GET /api/marketplace` | Hair ads — `search`, `hair_type`, `texture`, `sort`, `status` (active/sold) |
| `GET /api/marketplace/:id` | Ad detail + buyer comments + seller reviews + seller stats |
| `POST /api/marketplace` | Post a hair ad (auth) |
| `POST /api/marketplace/:id/comments` · `/interest` · `/reviews` | Buyer claim / interest / review |
| `PATCH /api/marketplace/:id/status` | Mark sold / active (seller or admin) |
| `GET /api/challenges` · `GET /api/challenges/:id` | Community challenges + participants/updates |
| `POST /api/challenges/:id/join` | Join a challenge |
| `GET /api/ai/looks` · `GET /api/ai/styles` | AI photo/video studio catalogue |
| `POST /api/ai/looks/:id/like` | Like an AI look |
| `GET /api/activity` | Unified community activity feed |
| `GET /api/admin/stats` · `/posts` · `/categories` · `/users` · `/listings` · `/ai-looks` | Admin (JWT + `role=admin`) |

## Platform sections

- **Feed** — `/` — 550 real women-only hair posts across 11 collections
  (long silky hair, bob, short bob, half headshave, full headshave, very long
  hair, Asian/Russian/black/brown/Chinese hair) with a unified activity feed and
  a "Hot right now" marketplace strip.
- **Marketplace** — `/marketplace` — hair buy/sell ads with specs, seller panel
  (mark sold), buyer comments to claim, and mandatory 5/4/3-star positive reviews.
- **AI Studio** — `/ai` — browse AI photo/video looks, like, generate a preview
  modal, and submit your own concept.
- **Challenges** — `/challenges` — join community challenges, see participant
  updates, earn the badge.

## Admin / Studio panel

`/admin` — guard-railed by `role=admin`:

- **Overview** — total posts, views, likes, notes; most-viewed entries; entries per collection.
- **Entries** — search/filter table; create/edit modal (title, category, YouTube/Telegram/Drive links, thumbnail URL, description, premium flag + price, publish toggle).
- **Collections** — manage categories (name/slug/description).
- **Members** — search, promote to admin, ban/unban, remove.
- **Marketplace** — approve/hold/remove ads, mark sold, delete with buyer comments + reviews.
- **AI looks** — approve/hold/reject AI studio submissions.

## Google sign-in

Email signup/login works out of the box. To enable **Continue with Google**:

1. Create an OAuth client ID at Google Cloud Console.
2. Run the server with `GOOGLE_CLIENT_ID=...` set.
3. Wire the GIS button in `client/src/pages/Login.jsx` / `Signup.jsx`.

The server verifies ID tokens against Google's published JWKS (`server/lib/google.js`).

## Notes

- Thumbnails are URL-references (auto-derived from YouTube when empty) — no upload endpoint, consistent with the "external media only" rule.
- All content is women-only; the scraper (`server/scripts/scrape-hair.js`) filters male/beard keywords and stores 50+ validated videos per category in `server/data/hair_photos.json`.
- `server/data/filora.db` is created locally and git-ignored; re-seed with `FORCE=1 node server/seed.js`.
