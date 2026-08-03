import { Link } from 'react-router-dom';
import { Eye, MessageCircle, Compass } from 'lucide-react';
import { fmtViews } from '../api';

export default function CategoryNav({ categories, activeSlug, basePath = '/' }) {
  return (
    <div className="cat-bar">
      <div className="cat-scroll">
        <Link to={basePath} className={`cat-chip ${!activeSlug ? 'active' : ''}`}>
          All looks
          <span className="count">{categories.reduce((a, c) => a + c.post_count, 0)}</span>
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            to={activeSlug ? `/category/${c.slug}` : basePath === '/' ? `/category/${c.slug}` : `/category/${c.slug}`}
            className={`cat-chip ${activeSlug === c.slug ? 'active' : ''}`}
          >
            {c.name}
            <span className="count">{c.post_count}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="hero">
      <div className="container">
        <p className="eyebrow" style={{ color: 'var(--brass-soft)' }}>Filora Media — Est. for hair people</p>
        <h1>Honest hair content, <em>streamed</em> from the people who live it.</h1>
        <p className="lede">
          Long hair, short hair, bald, perms, bobs, braids — one carefully curated studio feed
          of real tutorials. No filler, no fake shop. Just good hair.
        </p>
        <div className="hero-stats">
          <div className="hero-stat"><b>38</b><span>Studio entries</span></div>
          <div className="hero-stat"><b>7</b><span>Collections</span></div>
          <div className="hero-stat"><b>950K+</b><span>Community views</span></div>
        </div>
      </div>
    </section>
  );
}

export function FeedSection({ posts, title, meta }) {
  return (
    <section className="container">
      <div className="sec-head">
        <div>
          <p className="eyebrow">The feed</p>
          <h2>{title || 'Latest from the studio'}</h2>
        </div>
        {meta && <span className="meta">{meta}</span>}
      </div>
      {posts.length === 0 ? (
        <div className="empty">
          <Compass size={40} />
          <p>Nothing here yet — check back soon, or try a different collection.</p>
        </div>
      ) : (
        <div className="grid grid-feed">
          {posts.map((p) => <PostCard key={p.id} post={p} />)}
        </div>
      )}
    </section>
  );
}

export function SectionEmpty({ icon: Icon = Compass, text }) {
  return (
    <div className="empty">
      <Icon size={40} />
      <p>{text}</p>
    </div>
  );
}

export function PostSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-feed">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card">
          <div className="card-thumb skel" />
          <div className="card-body">
            <div className="skel" style={{ height: 16, width: '90%', marginBottom: 10 }} />
            <div className="skel" style={{ height: 12, width: '50%' }} />
          </div>
        </div>
      ))}
    </div>
  );
}
