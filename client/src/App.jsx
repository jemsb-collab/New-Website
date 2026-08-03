import { Routes, Route, Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { api, initials } from './api';
import {
  Home, Compass, Bookmark, ShieldCheck, Search, LogOut, User as UserIcon,
  Store, Sparkles, Trophy,
} from 'lucide-react';
import HomePage from './pages/Home';
import CategoryPage from './pages/Category';
import PostDetailPage from './pages/PostDetail';
import LoginPage from './pages/Login';
import SignupPage from './pages/Signup';
import ProfilePage from './pages/Profile';
import MarketplacePage from './pages/Marketplace';
import MarketplaceDetailPage from './pages/MarketplaceDetail';
import AIStudioPage from './pages/AIStudio';
import ChallengesPage from './pages/Challenges';
import ChallengeDetailPage from './pages/ChallengeDetail';
import AdminLayout from './pages/admin/AdminLayout';
import AdminStats from './pages/admin/AdminStats';
import AdminPosts from './pages/admin/AdminPosts';
import AdminCategories from './pages/admin/AdminCategories';
import AdminUsers from './pages/admin/AdminUsers';
import AdminMarketplace from './pages/admin/AdminMarketplace';
import AdminAiLooks from './pages/admin/AdminAiLooks';
import NotFound from './pages/NotFound';

function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [q, setQ] = useState('');
  const menuRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const submit = (e) => {
    e.preventDefault();
    if (q.trim()) navigate(`/?q=${encodeURIComponent(q.trim())}`);
    setQ('');
  };

  return (
    <header className="site-header">
      <div className="container">
        <Link to="/" className="brand">
          <span className="brand-mark">Filora<em>.</em></span>
          <span className="brand-tag">Media · FM</span>
        </Link>

        <nav className="main-nav">
          <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Feed</Link>
          <Link to="/marketplace" className={location.pathname.startsWith('/marketplace') ? 'active' : ''}><Store size={14} style={{ marginRight: 4, verticalAlign: -2 }} />Marketplace</Link>
          <Link to="/ai" className={location.pathname.startsWith('/ai') ? 'active' : ''}><Sparkles size={14} style={{ marginRight: 4, verticalAlign: -2 }} />AI Studio</Link>
          <Link to="/challenges" className={location.pathname.startsWith('/challenges') ? 'active' : ''}><Trophy size={14} style={{ marginRight: 4, verticalAlign: -2 }} />Challenges</Link>
          {user?.role === 'admin' && (
            <Link to="/admin" className={location.pathname.startsWith('/admin') ? 'active' : ''}>
              <ShieldCheck size={15} style={{ marginRight: 4, verticalAlign: -2 }} /> Studio
            </Link>
          )}
        </nav>

        <form className="header-search" onSubmit={submit}>
          <Search size={15} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the studio…" aria-label="Search" />
        </form>

        <div className="header-right">
          {user ? (
            <div className="user-menu" ref={menuRef}>
              <button className="icon-btn" onClick={() => setMenuOpen((v) => !v)} aria-label="Account">
                {user.avatar_url ? (
                  <span className="avatar"><img src={user.avatar_url} alt="" /></span>
                ) : (
                  <span className="avatar">{initials(user.name)}</span>
                )}
              </button>
              {menuOpen && (
                <div className="user-menu-panel">
                  <div className="menu-head">
                    <strong>{user.name}</strong>
                    <span>{user.email}</span>
                  </div>
                  <Link to="/profile" onClick={() => setMenuOpen(false)}><UserIcon size={15} /> Your profile</Link>
                  <Link to="/profile?tab=saves" onClick={() => setMenuOpen(false)}><Bookmark size={15} /> Saved posts</Link>
                  {user.role === 'admin' && (
                    <Link to="/admin" onClick={() => setMenuOpen(false)}><ShieldCheck size={15} /> Studio admin</Link>
                  )}
                  <button
                    onClick={() => { logout(); setMenuOpen(false); navigate('/'); }}
                  >
                    <LogOut size={15} /> Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
        <div className="header-actions">
          <Link to="/login" className="btn btn-ghost btn-sm" style={{ color: 'var(--ivory)', borderColor: 'rgba(242,238,227,0.3)' }}>Sign in</Link>
          <Link to="/signup" className="btn btn-primary btn-sm">Join FM</Link>
        </div>
          )}
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="grid-foot">
          <div>
            <span className="brand-mark">Filora<em>.</em> Media</span>
            <p style={{ fontSize: '0.9rem', maxWidth: '34ch', marginTop: 8 }}>
              The home of honest hair content. Real tutorials, real tools, zero filler —
              streamed from the people who actually do this for a living.
            </p>
          </div>
          <div>
            <h5>Explore</h5>
            <Link to="/">Feed</Link>
            <Link to="/marketplace">Hair marketplace</Link>
            <Link to="/ai">AI Studio</Link>
            <Link to="/challenges">Challenges</Link>
          </div>
          <div>
            <h5>Studio</h5>
            <Link to="/signup">Join the community</Link>
            <Link to="/login">Member sign in</Link>
            <Link to="/marketplace">Sell your hair</Link>
            <Link to="/category/very-long-hair">Very long hair</Link>
          </div>
        </div>
        <div className="bottom">
          <span>© 2026 Filora Media</span>
          <span>FILORA — hair content, done properly.</span>
        </div>
      </div>
    </footer>
  );
}

function Layout() {
  return (
    <>
      <Header />
      <Outlet />
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="/category/:slug" element={<CategoryPage />} />
        <Route path="/post/:id" element={<PostDetailPage />} />
        <Route path="/marketplace" element={<MarketplacePage />} />
        <Route path="/marketplace/:id" element={<MarketplaceDetailPage />} />
        <Route path="/ai" element={<AIStudioPage />} />
        <Route path="/challenges" element={<ChallengesPage />} />
        <Route path="/challenges/:id" element={<ChallengeDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminStats />} />
        <Route path="posts" element={<AdminPosts />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="marketplace" element={<AdminMarketplace />} />
        <Route path="ai" element={<AdminAiLooks />} />
      </Route>
    </Routes>
  );
}
