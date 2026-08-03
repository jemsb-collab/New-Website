import { Link } from 'react-router-dom';
import { Eye, MessageCircle, Lock } from 'lucide-react';
import { fmtViews } from '../api';

export default function PostCard({ post }) {
  return (
    <article className="card">
      <Link to={`/post/${post.id}`} className="card-thumb">
        <img
          src={post.thumbnail_url || 'https://picsum.photos/seed/fm-missing/600/750'}
          alt={post.title}
          loading="lazy"
        />
        {post.category_name && <span className="card-badge">{post.category_name}</span>}
        {post.is_premium && (
          <span className="card-badge premium" style={{ left: 'auto', right: 12 }}>
            <Lock size={10} style={{ verticalAlign: -1 }} /> Signature
          </span>
        )}
        <span className="views-chip"><Eye size={11} style={{ verticalAlign: -2 }} /> {fmtViews(post.view_count)}</span>
      </Link>
      <div className="card-body">
        <h3 className="card-title"><Link to={`/post/${post.id}`}>{post.title}</Link></h3>
        <div className="card-meta">
          <div className="card-meta-left">
            <span><Eye size={13} /> {fmtViews(post.view_count)}</span>
            <span><MessageCircle size={13} /> {post.comment_count}</span>
          </div>
          <span className="mono">{post.category_name || 'General'}</span>
        </div>
      </div>
    </article>
  );
}
