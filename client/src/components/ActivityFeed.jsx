import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Heart, Star, Sparkles, ShoppingBag, Activity } from 'lucide-react';
import { api, fmtDate, initials } from '../api';

const KIND = {
  comment: { icon: MessageCircle, label: 'commented on', to: (a) => `/post/${a.ref}` },
  buy: { icon: ShoppingBag, label: 'interested in', to: (a) => `/marketplace/${a.ref}` },
  like: { icon: Heart, label: 'liked', to: (a) => `/post/${a.ref}` },
  review: { icon: Star, label: 'reviewed', to: (a) => `/marketplace/${a.ref}` },
  ai: { icon: Sparkles, label: 'shared an AI look', to: (a) => `/ai` },
};

export default function ActivityFeed() {
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/api/activity').then((d) => setActivity(d.activity)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading || activity.length === 0) return null;

  return (
    <aside className="panel" style={{ marginBottom: 0 }}>
      <h3 className="serif" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Activity size={15} style={{ color: 'var(--brass)' }} /> Community pulse
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {activity.slice(0, 12).map((a) => {
          const k = KIND[a.kind] || KIND.comment;
          const Icon = k.icon;
          return (
            <Link to={k.to(a)} key={`${a.kind}-${a.id}`} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              {a.user_avatar ? (
                <img className="avatar" src={a.user_avatar} alt="" style={{ width: 30, height: 30 }} />
              ) : (
                <span className="avatar" style={{ width: 30, height: 30, fontSize: '0.7rem' }}>{initials(a.user_name)}</span>
              )}
              <div style={{ fontSize: '0.83rem', lineHeight: 1.4 }}>
                <span style={{ fontWeight: 700 }}>{a.user_name}</span> {k.label}{' '}
                <span style={{ color: 'var(--copper)', fontWeight: 600 }}>{a.target}</span>
                {a.text && <span className="muted"> — “{a.text.slice(0, 60)}{a.text.length > 60 ? '…' : ''}”</span>}
                <div className="mono tiny" style={{ color: 'var(--muted)', marginTop: 2 }}>{fmtDate(a.created_at)}</div>
              </div>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
