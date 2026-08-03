import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Heart, Users } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import PostCard from '../components/PostCard';
import CategoryNav, { PostSkeleton, SectionEmpty } from '../components/CategoryNav';

const PER = 12;

export default function Category() {
  const { slug } = useParams();
  const { user, loading: authLoading } = useAuth();
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState(null);
  const [posts, setPosts] = useState([]);
  const [sort, setSort] = useState('latest');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadPosts = async (reset = false) => {
    setLoading(true);
    setError('');
    try {
      const offset = reset ? 0 : posts.length;
      const data = await api(`/api/posts?category=${slug}&sort=${sort}&limit=${PER}&offset=${offset}`);
      setPosts(reset ? data.posts : [...posts, ...data.posts]);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([
      api('/api/categories').then((d) => d.categories),
      api(`/api/categories/${slug}`).then((d) => d.category),
    ]).then(([cats, cat]) => {
      setCategories(cats);
      setCategory(cat);
    }).catch(() => setError('Collection not found.'));
  }, [slug]);

  useEffect(() => {
    setPosts([]);
    loadPosts(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, sort, authLoading]);

  const toggleFollow = async () => {
    if (!user) return;
    const method = category.is_followed ? 'DELETE' : 'POST';
    const data = await api(`/api/categories/${category.id}/follow`, { method });
    setCategory((c) => ({ ...c, is_followed: data.followed }));
  };

  const hasMore = posts.length < (category?.post_count || 0);

  return (
    <>
      <div className="cat-bar">
        <div className="cat-scroll">
          <Link to="/" className="cat-chip">All looks</Link>
          {categories.map((c) => (
            <Link key={c.id} to={`/category/${c.slug}`} className={`cat-chip ${c.slug === slug ? 'active' : ''}`}>
              {c.name}
              <span className="count">{c.post_count}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="container" style={{ paddingTop: 36 }}>
        {category && (
          <div className="sec-head">
            <div>
              <p className="eyebrow">Collection</p>
              <h2>{category.name}</h2>
              <p className="muted" style={{ maxWidth: '52ch', marginTop: 6 }}>{category.description}</p>
              <div className="card-meta" style={{ marginTop: 12 }}>
                <span><Users size={13} /> {category.follower_count} following</span>
              </div>
            </div>
            {user && (
              <button className={`follow-pill ${category.is_followed ? 'following' : ''}`} onClick={toggleFollow}>
                <Heart size={14} /> {category.is_followed ? 'Following' : 'Follow collection'}
              </button>
            )}
          </div>
        )}

        <div className="sort-tabs" style={{ marginBottom: 24 }}>
          <button className={sort === 'latest' ? 'active' : ''} onClick={() => setSort('latest')}>Latest</button>
          <button className={sort === 'popular' ? 'active' : ''} onClick={() => setSort('popular')}>Most viewed</button>
          <button className={sort === 'engaged' ? 'active' : ''} onClick={() => setSort('engaged')}>Most engaged</button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {!loading && posts.length === 0 && !error && (
          <SectionEmpty text="No entries in this collection yet." />
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
            <button className="btn btn-dark" onClick={loadPosts}>Load more</button>
          </div>
        )}
      </div>
    </>
  );
}
