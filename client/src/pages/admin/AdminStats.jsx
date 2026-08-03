import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Heart, MessageCircle, FileText, Tags, Users, Zap } from 'lucide-react';
import { api, fmtViews } from '../../api';

export default function AdminStats() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api('/api/admin/stats').then(setData).catch(() => {});
  }, []);

  if (!data) return <div className="spinner" />;
  const s = data.stats;

  const cards = [
    { label: 'Total entries', value: s.posts, icon: FileText },
    { label: 'Published', value: s.published, icon: Zap },
    { label: 'Collections', value: s.categories, icon: Tags },
    { label: 'Members', value: s.users, icon: Users },
    { label: 'Total views', value: fmtViews(s.total_views), icon: Eye },
    { label: 'Likes', value: s.total_likes, icon: Heart },
    { label: 'Notes', value: s.total_comments, icon: MessageCircle },
  ];

  return (
    <>
      <p className="eyebrow">Studio overview</p>
      <h1 className="serif">Dashboard</h1>
      <p className="muted" style={{ marginTop: -6 }}>Platform health at a glance.</p>

      <div className="stat-grid">
        {cards.map(({ label, value, icon: Icon }) => (
          <div className="stat-card" key={label}>
            <Icon size={16} style={{ color: 'var(--brass)', marginBottom: 8 }} />
            <b>{value}</b>
            <span>{label}</span>
          </div>
        ))}
      </div>

      <div className="panel">
        <h3 className="serif">Most viewed entries</h3>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr><th>Title</th><th>Views</th><th>Likes</th><th>Notes</th><th></th></tr>
            </thead>
            <tbody>
              {data.top_posts.map((p) => (
                <tr key={p.id}>
                  <td>{p.title}</td>
                  <td className="mono">{fmtViews(p.view_count)}</td>
                  <td className="mono">{p.like_count}</td>
                  <td className="mono">{p.comment_count}</td>
                  <td style={{ textAlign: 'right' }}>
                    <Link to={`/post/${p.id}`} className="btn btn-ghost btn-sm">Open</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel">
        <h3 className="serif">Entries by collection</h3>
        {data.by_category.map((c) => (
          <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <span style={{ width: 150, fontWeight: 600 }}>{c.name}</span>
            <div style={{ flex: 1, height: 8, background: 'var(--pine-50)', borderRadius: 4, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${data.stats.posts ? Math.round((c.count / data.stats.posts) * 100) : 0}%`,
                  background: 'linear-gradient(90deg, var(--brass), var(--copper))',
                  borderRadius: 4,
                }}
              />
            </div>
            <span className="mono" style={{ width: 40, textAlign: 'right' }}>{c.count}</span>
          </div>
        ))}
      </div>
    </>
  );
}
