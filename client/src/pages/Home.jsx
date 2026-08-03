import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Store, Sparkles, Trophy } from 'lucide-react';
import { api, fmtCompact } from '../api';
import PostCard from '../components/PostCard';
import CategoryNav, { PostSkeleton, SectionEmpty } from '../components/CategoryNav';
import ActivityFeed from '../components/ActivityFeed';

const PER = 12;

export default function Home() {
  const [params] = useSearchParams();
  const q = params.get('q') || '';
  const [categories, setCategories] = useState([]);
  const [posts, setPosts] = useState([]);
  const [sort, setSort] = useState('latest');
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');
  const [hero, setHero] = useState(null);
  const [listings, setListings] = useState([]);

  const load = async (reset = false) => {
    setLoading(true);
    setError('');
    try {
      const offset = reset ? 0 : posts.length;
      const data = await api(`/api/posts?sort=${sort}&limit=${PER}&offset=${offset}${q ? `&search=${encodeURIComponent(q)}` : ''}`);
      setPosts(reset ? data.posts : [...posts, ...data.posts]);
      setTotal(data.total);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([
      api('/api/categories').then((d) => d.categories),
      api('/api/activity').then((d) => d.activity.length).catch(() => 0),
    ]).then(([cats]) => {
      setCategories(cats);
      setHero({
        posts: total,
        categories: cats.length,
        views: cats.reduce((a, c) => a + c.post_count, 0) * 1800,
      });
    }).catch(() => {});
    api('/api/marketplace?sort=popular&limit=4').then((d) => setListings(d.listings)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setPosts([]);
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort, q]);

  useEffect(() => {
    if (hero) setHero((h) => ({ ...h, posts: total }));
  }, [total, hero]);

  const hasMore = posts.length < total;

  return (
    <>
      <section className="hero">
        <div className="container">
          <p className="eyebrow" style={{ color: 'var(--brass-soft)' }}>Filora Media — Est. for hair people</p>
          <h1>Honest hair content, <em>streamed</em> from the people who live it.</h1>
          <p className="lede">
            Silky long hair, bobs, headshave styles, every texture and every origin —
            one curated studio feed plus a live hair marketplace. No filler. Just good hair.
          </p>
          <div className="hero-stats">
            <div className="hero-stat"><b>{fmtCompact(hero?.posts || 0)}</b><span>Studio entries</span></div>
            <div className="hero-stat"><b>{hero?.categories || 0}</b><span>Collections</span></div>
            <div className="hero-stat"><b>{fmtCompact(hero?.views || 0)}</b><span>Community views</span></div>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 30 }}>
            <Link to="/marketplace" className="btn btn-brass"><Store size={15} /> Buy & sell hair</Link>
            <Link to="/ai" className="btn btn-ghost" style={{ borderColor: 'rgba(242,238,227,0.4)', color: 'var(--ivory)' }}><Sparkles size={15} /> AI Studio</Link>
            <Link to="/challenges" className="btn btn-ghost" style={{ borderColor: 'rgba(242,238,227,0.4)', color: 'var(--ivory)' }}><Trophy size={15} /> Challenges</Link>
          </div>
        </div>
      </section>

      <CategoryNav categories={categories} activeSlug={null} />

      <div className="container">
        <div className="sec-head">
          <div>
            <p className="eyebrow">{q ? 'Search results' : 'The feed'}</p>
            <h2>{q ? `Results for “${q}”` : 'Latest from the studio'}</h2>
          </div>
          <div className="sort-tabs">
            <button className={sort === 'latest' ? 'active' : ''} onClick={() => setSort('latest')}>Latest</button>
            <button className={sort === 'popular' ? 'active' : ''} onClick={() => setSort('popular')}>Most viewed</button>
            <button className={sort === 'engaged' ? 'active' : ''} onClick={() => setSort('engaged')}>Most engaged</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: 28, alignItems: 'start' }} className="home-layout">
          <div>
            {error && <div className="alert alert-error">{error}</div>}
            {!loading && posts.length === 0 && !error && (
              <SectionEmpty text={q ? `No studio entries match “${q}”. Try another search.` : 'No entries yet.'} />
            )}

            {posts.length > 0 && (
              <div className="grid grid-feed">
                {posts.map((p) => <PostCard key={p.id} post={p} />)}
              </div>
            )}
            {loading && posts.length === 0 && <PostSkeleton count={8} />}
            {loading && posts.length > 0 && <div className="spinner" />}

            {hasMore && !loading && (
              <div className="load-more">
                <button className="btn btn-dark" onClick={() => load(false)}>
                  Load more ({total - posts.length} remaining)
                </button>
              </div>
            )}
          </div>

          <div className="home-side">
            <ActivityFeed />
            {listings.length > 0 && (
              <div className="panel" style={{ marginTop: 20 }}>
                <h3 className="serif" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Store size={15} style={{ color: 'var(--brass)' }} /> Hot right now
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {listings.map((l) => (
                    <Link to={`/marketplace/${l.id}`} key={l.id} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <img src={l.cover} alt="" style={{ width: 46, height: 46, borderRadius: 10, objectFit: 'cover' }} loading="lazy" />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, lineHeight: 1.25, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.title}</div>
                        <div className="mono tiny" style={{ color: 'var(--copper)' }}>${Math.round(l.price_cents / 100)}</div>
                      </div>
                    </Link>
                  ))}
                </div>
                <Link to="/marketplace" className="btn btn-ghost btn-sm btn-block" style={{ marginTop: 12 }}>View all ads</Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1000px) { .home-layout { grid-template-columns: 1fr !important; } .home-side { order: -1; } }
      `}</style>
    </>
  );
}
