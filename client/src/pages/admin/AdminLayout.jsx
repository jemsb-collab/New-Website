import { Navigate, NavLink, Outlet, Link } from 'react-router-dom';
import { LayoutDashboard, FileText, Tags, Users, Store, Sparkles, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../AuthContext';

export default function AdminLayout() {
  const { user, loading } = useAuth();

  if (loading) return <div className="spinner" />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') {
    return (
      <div className="container" style={{ padding: '80px 0' }}>
        <div className="alert alert-error">Admin access required. This area is reserved for the Filora studio team.</div>
        <Link to="/" className="btn btn-dark">Back to the feed</Link>
      </div>
    );
  }

  const nav = [
    { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/admin/posts', label: 'Entries', icon: FileText },
    { to: '/admin/marketplace', label: 'Marketplace', icon: Store },
    { to: '/admin/ai', label: 'AI looks', icon: Sparkles },
    { to: '/admin/categories', label: 'Collections', icon: Tags },
    { to: '/admin/users', label: 'Members', icon: Users },
  ];

  return (
    <div className="admin-layout">
      <aside className="admin-side">
        <h4>Filora Studio</h4>
        {nav.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end}>
            <Icon size={16} /> {label}
          </NavLink>
        ))}
        <div style={{ marginTop: 24 }}>
          <Link to="/" style={{ color: 'rgba(242,238,227,0.55)' }}><ArrowLeft size={16} style={{ verticalAlign: -2 }} /> Back to site</Link>
        </div>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
