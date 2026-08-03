import { useEffect, useState } from 'react';
import { Link, useSearchParams, Navigate } from 'react-router-dom';
import { Bookmark, Heart, MessageCircle, Users, Compass } from 'lucide-react';
import { api, initials, fmtDate } from '../api';
import { useAuth } from '../AuthContext';
import PostCard from '../components/PostCard';
import { PostSkeleton, SectionEmpty } from '../components/CategoryNav';

export default function Profile() {
  const { user, loading } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'saves';
  const [saves, setSaves] = useState([]);
  const [follows, setFollows] = useState([]);
  const [stats, setStats] = useState(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      api('/api/users/me/saves'),
      api('/api/users/me/follows'),
      api('/api/users/me/stats'),
    ]).then(([s, f, st]) => {
      setSaves(s.posts);
      setFollows(f.categories);
      setStats(st);
    }).finally(() => setLoadingData(false));
  }, [user]);

  if (loading) return <div className="spinner" />;
  if (!user) return <Navigate to="/login" replace />;

  const unfollow = async (cat) => {
    await api(`/api/categories/${cat.id}/follow`, { method: 'DELETE' });
    setFollows((fs) => fs.filter((c) => c.id !== cat.id));
  };

  return (
    <>
      <div className="profile-head">
        <div className="container">
          <div className="inner">
            {user.avatar_url ? (
              <img className="avatar" src={user.avatar_url} alt="" />
            ) : (
              <span className="avatar">{initials(user.name)}</span>
            )}
            <div>
              <h1 className="serif">{user.name}</h1>
              <div className="mono">{user.email}</div>
              {stats && (
                <div className="stat-row">
                  <div className="stat"><b>{stats.saved}</b><span>Saved</span></div>
                  <div className="stat"><b>{stats.following}</b><span>Following</span></div>
                  <div className="stat"><b>{stats.comments}</b><span>Notes</span></div>
                  <div className="stat"><b>{stats.liked}</b><span>Likes</span></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingBottom: 60 }}>
        <div className="sec-head">
          <div>
            <p className="eyebrow">Your space</p>
            <h2>{tab === 'saves' ? 'Saved looks' : 'Followed collections'}</h2>
          </div>
          <div className="sort-tabs">
            <button className={tab === 'saves' ? 'active' : ''} onClick={() => setParams({ tab: 'saves' })}>
              <Bookmark size={13} style={{ verticalAlign: -2 }} /> Saved
            </button>
            <button className={tab === 'follows' ? 'active' : ''} onClick={() => setParams({ tab: 'follows' })}>
              <Users size={13} style={{ verticalAlign: -2 }} /> Following
            </button>
          </div>
        </div>

        {tab === 'saves' && (
          loadingData ? <PostSkeleton count={6} /> :
          saves.length === 0 ? (
            <SectionEmpty icon={Bookmark} text="Nothing saved yet. Tap the bookmark on any post to keep it here." />
          ) : (
            <div className="grid grid-feed">
              {saves.map((p) => <PostCard key={p.id} post={p} />)}
            </div>
          )
        )}

        {tab === 'follows' && (
          loadingData ? <div className="spinner" /> :
          follows.length === 0 ? (
            <SectionEmpty icon={Compass} text="You are not following any collections yet. Browse categories and hit follow." />
          ) : (
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
              {follows.map((c) => (
                <div className="card" key={c.id}>
                  <div className="card-body">
                    <h3 className="card-title"><Link to={`/category/${c.slug}`}>{c.name}</Link></h3>
                    <p className="muted tiny" style={{ margin: '0 0 12px' }}>{c.description}</p>
                    <div className="card-meta" style={{ marginBottom: 14 }}>
                      <span className="mono">{c.post_count} entries</span>
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={() => unfollow(c)}>Unfollow</button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </>
  );
}
