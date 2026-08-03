# Filora Media (FM) — Hair Content Platform

A premium-feeling social platform for hair styling content — long hair, short hair,
bald, perms, bobs, braids and everything between. **Not** a plain e-commerce
catalog: it is built as a media brand (feed, likes, comments, saves, category
follows, share) with no purchase flow for now.

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
  db.js                 node:sqlite schema (payment-ready)
  seed.js               demo seed (real hair tutorial videos)
  auth.js               JWT helpers
  lib/media.js          YouTube/Telegram/Drive link parsing
  lib/google.js         Google ID-token verification (JWKS)
  routes/               auth, posts, categories, users, admin
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

## Demo accounts (seeded)

| Role   | Email                | Password     |
| ------ | -------------------- | ------------ |
| Admin  | `admin@filora.media` | `password123` |
| Viewer | `demo1@filora.media` | `password123` |

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
| `GET /api/admin/stats` · `/posts` · `/categories` · `/users` | Admin (JWT + `role=admin`) |

## Admin / Studio panel

`/admin` — guard-railed by `role=admin`:

- **Overview** — total posts, views, likes, notes; most-viewed entries; entries per collection.
- **Entries** — search/filter table; create/edit modal (title, category, YouTube/Telegram/Drive links, thumbnail URL, description, premium flag + price, publish toggle).
- **Collections** — manage categories (name/slug/description).
- **Members** — search, promote to admin, ban/unban, remove.

## Google sign-in

Email signup/login works out of the box. To enable **Continue with Google**:

1. Create an OAuth client ID at Google Cloud Console.
2. Run the server with `GOOGLE_CLIENT_ID=...` set.
3. Wire the GIS button in `client/src/pages/Login.jsx` / `Signup.jsx`.

The server verifies ID tokens against Google's published JWKS (`server/lib/google.js`).

## Notes

- Thumbnails are URL-references (auto-derived from YouTube when empty) — no upload endpoint, consistent with the "external media only" rule.
- `server/data/filora.db` is created locally and git-ignored; re-seed with `npm run db:seed`.
