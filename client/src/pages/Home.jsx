import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';
import PostCard from '../components/PostCard';
import CategoryNav, { Hero, PostSkeleton, SectionEmpty } from '../components/CategoryNav';

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
    api('/api/categories').then((d) => setCategories(d.categories)).catch(() => {});
  }, []);

  useEffect(() => {
    setPosts([]);
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort, q]);

  const hasMore = posts.length < total;

  return (
    <>
      <Hero />
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
    </>
  );
}
