import { Link } from 'react-router-dom';
import { Eye, MessageCircle, Heart, BadgeCheck } from 'lucide-react';
import { fmtMoney, fmtCompact } from '../api';
import StarRating from './StarRating';

export default function ListingCard({ listing }) {
  return (
    <article className="card">
      <Link to={`/marketplace/${listing.id}`} className="card-thumb">
        <img
          src={listing.cover || 'https://picsum.photos/seed/fm-listing/600/750'}
          alt={listing.title}
          loading="lazy"
        />
        {listing.status === 'sold' && (
          <span className="card-badge" style={{ background: 'rgba(179,54,46,0.9)' }}>Sold</span>
        )}
        <span className="card-badge" style={{ left: 'auto', right: 12, background: 'rgba(169,129,46,0.92)' }}>
          {listing.hair_type || 'Virgin'}
        </span>
        <span className="views-chip"><Eye size={11} style={{ verticalAlign: -2 }} /> {fmtCompact(listing.view_count)}</span>
      </Link>
      <div className="card-body">
        <h3 className="card-title" style={{ fontSize: '1rem' }}>
          <Link to={`/marketplace/${listing.id}`}>{listing.title}</Link>
        </h3>
        <div className="card-meta" style={{ marginBottom: 10 }}>
          <span className="mono" style={{ color: 'var(--copper)', fontWeight: 700, fontSize: '0.9rem' }}>
            {fmtMoney(listing.price_cents, listing.currency)}
          </span>
          <span className="mono tiny">{listing.texture} · {listing.length_cm ? `${listing.length_cm}cm` : '—'}</span>
        </div>
        <div className="card-meta">
          <div className="card-meta-left">
            {listing.rating_avg ? (
              <span title={`${listing.rating_avg} / 5`}>
                <StarRating value={listing.rating_avg} size={12} />
              </span>
            ) : (
              <span className="tiny muted">New seller</span>
            )}
            <span><MessageCircle size={13} /> {listing.comment_count}</span>
            <span><Heart size={13} /> {listing.interest_count}</span>
          </div>
          <span className="tiny" style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--pine-700)' }}>
            {listing.seller_name}
            {listing.seller_role === 'admin' && <BadgeCheck size={13} style={{ color: 'var(--brass)' }} />}
          </span>
        </div>
      </div>
    </article>
  );
}
