import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Eye, Heart, Send, Scissors, Ruler, Scale, Palette, Tag, BadgeCheck,
  MessageCircle, ShieldCheck, CheckCircle2,
} from 'lucide-react';
import { api, fmtMoney, fmtDate, initials } from '../api';
import { useAuth } from '../AuthContext';
import StarRating from '../components/StarRating';

export default function MarketplaceDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [interested, setInterested] = useState(false);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [toast, setToast] = useState('');

  const load = () => {
    api(`/api/marketplace/${id}`).then((d) => {
      setData(d);
      setInterested(!!d.listing.is_interested);
      document.title = `${d.listing.title} — FM Marketplace`;
    }).catch((e) => setError(e.message)).finally(() => setLoading(false));
  };
  useEffect(load, [id]);

  const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 2000); };

  const toggleInterest = async () => {
    if (!user) { notify('Sign in to show interest.'); return; }
    const method = interested ? 'DELETE' : 'POST';
    const d = await api(`/api/marketplace/${id}/interest`, { method });
    setInterested(d.interested);
    setData((prev) => ({ ...prev, listing: { ...prev.listing, interest_count: d.interest_count } }));
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    if (!user) { notify('Sign in to comment.'); return; }
    setBusy(true);
    try {
      const c = await api(`/api/marketplace/${id}/comments`, { method: 'POST', body: { body: comment } });
      setData((prev) => ({ ...prev, comments: [c, ...prev.comments] }));
      setComment('');
    } finally { setBusy(false); }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!user) { notify('Sign in to review.'); return; }
    setBusy(true);
    try {
      await api(`/api/marketplace/${id}/reviews`, { method: 'POST', body: { rating, body: reviewText } });
      setReviewText('');
      setRating(5);
      notify('Thanks for your review!');
      load();
    } catch (err) {
      notify(err.message);
    } finally { setBusy(false); }
  };

  const markSold = async (status) => {
    await api(`/api/marketplace/${id}/status`, { method: 'PATCH', body: { status } });
    notify(status === 'sold' ? 'Marked as sold.' : 'Back on sale.');
    load();
  };

  if (loading) return <div className="spinner" />;
  if (error || !data) return (
    <div className="container" style={{ padding: '80px 0' }}>
      <div className="alert alert-error">{error || 'Listing not found.'}</div>
      <Link to="/marketplace" className="btn btn-dark">Back to marketplace</Link>
    </div>
  );

  const { listing, comments, reviews, seller_stats } = data;
  const isOwner = user && user.id === listing.seller_id;
  const canReview = user && !isOwner;

  const specs = [
    { icon: Scissors, label: 'Type', value: listing.hair_type },
    { icon: Tag, label: 'Texture', value: listing.texture },
    { icon: Palette, label: 'Colour', value: listing.color },
    { icon: Ruler, label: 'Length', value: listing.length_cm ? `${listing.length_cm} cm` : '—' },
    { icon: Scale, label: 'Weight', value: listing.weight_grams ? `${listing.weight_grams} g` : '—' },
  ];

  return (
    <div className="detail-wrap" style={{ maxWidth: 960 }}>
      {toast && <div className="toast">{toast}</div>}

      <nav className="breadcrumb">
        <Link to="/">Feed</Link>
        <span>/</span>
        <Link to="/marketplace">Marketplace</Link>
        <span>/</span>
        <span>Ad {String(listing.id).padStart(4, '0')}</span>
      </nav>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 36, alignItems: 'start' }} className="mkt-grid">
        <div>
          {listing.photos.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
              {listing.photos.map((p, i) => (
                <a key={i} href={p} target="_blank" rel="noopener noreferrer">
                  <img src={p} alt={listing.title} style={{ width: '100%', aspectRatio: '4/5', objectFit: 'cover', borderRadius: 12 }} loading="lazy" />
                </a>
              ))}
            </div>
          ) : (
            <div className="media-frame" style={{ aspectRatio: '1/1' }}>
              <div className="link-out"><Scissors size={28} /><h3>No photos yet</h3></div>
            </div>
          )}
        </div>

        <div>
          <div className="detail-sub" style={{ marginBottom: 8 }}>
            {listing.status === 'sold'
              ? <span className="pill pill-red">Sold</span>
              : <span className="pill pill-green">For sale</span>}
            <span><Eye size={14} style={{ verticalAlign: -2 }} /> <span className="mono">{listing.view_count}</span> views</span>
          </div>
          <h1 className="serif" style={{ fontSize: '1.9rem' }}>{listing.title}</h1>

          <div className="mono" style={{ fontSize: '1.7rem', color: 'var(--copper)', fontWeight: 700, margin: '10px 0 16px' }}>
            {fmtMoney(listing.price_cents, listing.currency)}
          </div>

          <div className="media-strip" style={{ marginTop: 0 }}>
            <div className="specs" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, width: '100%' }}>
              {specs.map(({ icon: Icon, label, value }) => (
                <div key={label} className="media-chip" style={{ borderRadius: 10, justifyContent: 'flex-start' }}>
                  <Icon size={14} /> <span className="muted tiny" style={{ marginRight: 4 }}>{label}:</span> {value}
                </div>
              ))}
            </div>
          </div>

          <p className="desc-block" style={{ marginTop: 16 }}>{listing.description}</p>

          <div className="detail-actions" style={{ margin: '20px 0' }}>
            {listing.status === 'active' && (
              <button className={`btn ${interested ? 'btn-primary' : 'btn-ghost'}`} onClick={toggleInterest}>
                <Heart size={16} fill={interested ? 'currentColor' : 'none'} /> {interested ? 'Interested' : 'I want this'}
              </button>
            )}
            {isOwner && (
              <>
                <button className="btn btn-ghost" onClick={() => markSold(listing.status === 'sold' ? 'active' : 'sold')}>
                  <CheckCircle2 size={16} /> {listing.status === 'sold' ? 'Put back on sale' : 'Mark as sold'}
                </button>
              </>
            )}
          </div>

          <div className="panel" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              {listing.seller_avatar ? (
                <img className="avatar" src={listing.seller_avatar} alt="" style={{ width: 46, height: 46 }} />
              ) : (
                <span className="avatar" style={{ width: 46, height: 46 }}>{initials(listing.seller_name)}</span>
              )}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                  {listing.seller_name}
                  {listing.seller_role === 'admin' && <BadgeCheck size={15} style={{ color: 'var(--brass)' }} />}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <StarRating value={seller_stats.avg_rating} size={13} />
                  <span className="tiny muted">{seller_stats.review_count} reviews · {seller_stats.listing_count} ads</span>
                </div>
              </div>
              <a href={`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noopener noreferrer" className="btn btn-brass btn-sm">
                Contact seller
              </a>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }} className="mkt-bottom">
        <section className="comments">
          <h3 className="serif">Buyer comments</h3>
          <p className="muted tiny" style={{ marginTop: -10 }}>Buyers claim hair right here — be clear, be kind, close the deal.</p>
          <form className="comment-form" onSubmit={submitComment}>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={user ? '“Hi! Is this still available? I want it.”' : 'Sign in to comment.'}
              disabled={!user}
            />
            {user && (
              <button className="btn btn-primary" disabled={busy || !comment.trim()} style={{ borderRadius: 12 }}>
                <Send size={15} />
              </button>
            )}
          </form>
          {comments.length === 0 && <p className="muted tiny">No buyer comments yet.</p>}
          {comments.map((c) => (
            <div className="comment" key={c.id}>
              {c.user_avatar ? <img className="avatar" src={c.user_avatar} alt="" /> : <span className="avatar">{initials(c.user_name)}</span>}
              <div className="body">
                <span className="author">{c.user_name}</span>
                <span className="when">{fmtDate(c.created_at)}</span>
                <p className="text">{c.body}</p>
              </div>
            </div>
          ))}
        </section>

        <section className="comments">
          <h3 className="serif">Seller reviews</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0 16px' }}>
            <span className="mono" style={{ fontSize: '1.8rem', color: 'var(--brass)' }}>
              {seller_stats.avg_rating || '—'}
            </span>
            <div>
              <StarRating value={seller_stats.avg_rating} size={16} />
              <div className="tiny muted">{seller_stats.review_count} verified reviews</div>
            </div>
          </div>

          {canReview && (
            <form className="comment-form" onSubmit={submitReview}>
              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: 8 }}>
                  <StarRating value={rating} size={18} readonly={false} onChange={setRating} />
                </div>
                <textarea
                  rows={2}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="How was the hair and the seller?"
                />
                <button type="submit" className="btn btn-dark btn-sm" style={{ marginTop: 8 }} disabled={busy}>
                  <ShieldCheck size={14} /> Post review
                </button>
              </div>
            </form>
          )}

          {reviews.length === 0 && <p className="muted tiny">No reviews yet.</p>}
          {reviews.map((r) => (
            <div className="comment" key={r.id}>
              {r.user_avatar ? <img className="avatar" src={r.user_avatar} alt="" /> : <span className="avatar">{initials(r.user_name)}</span>}
              <div className="body">
                <span className="author">{r.user_name}</span>
                <span className="when">{fmtDate(r.created_at)}</span>
                <div style={{ margin: '4px 0' }}><StarRating value={r.rating} size={12} /></div>
                {r.body && <p className="text">{r.body}</p>}
              </div>
            </div>
          ))}
        </section>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .mkt-grid { grid-template-columns: 1fr !important; }
          .mkt-bottom { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
