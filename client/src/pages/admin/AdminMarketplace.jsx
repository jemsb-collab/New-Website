import { useEffect, useState } from 'react';
import { Search, Trash2, Eye, CheckCircle2, RotateCcw } from 'lucide-react';
import { api, fmtMoney, fmtDate } from '../../api';

export default function AdminMarketplace() {
  const [listings, setListings] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [toast, setToast] = useState('');

  const load = () => {
    api(`/api/admin/listings?search=${encodeURIComponent(search)}&status=${status}`).then((d) => setListings(d.listings)).catch(() => {});
  };
  useEffect(load, [search, status]);

  const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 1800); };

  const remove = async (l) => {
    if (!window.confirm(`Remove ad “${l.title}”? This also deletes its buyer comments and reviews.`)) return;
    await api(`/api/admin/listings/${l.id}`, { method: 'DELETE' });
    notify('Ad removed.');
    load();
  };

  const changeStatus = async (l, s) => {
    await api(`/api/admin/listings/${l.id}/status`, { method: 'PATCH', body: { status: s } });
    notify(s === 'sold' ? 'Marked as sold.' : 'Marked active.');
    load();
  };

  return (
    <>
      <p className="eyebrow">Commerce</p>
      <h1 className="serif">Marketplace ads</h1>

      <div className="toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid var(--line)', borderRadius: 8, padding: '0 10px', background: 'var(--white)' }}>
          <Search size={15} style={{ color: 'var(--muted)' }} />
          <input type="text" placeholder="Search ads…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ border: 'none', outline: 'none', padding: '9px 4px' }} />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ border: '1px solid var(--line)', borderRadius: 8, padding: '9px 12px', background: 'var(--white)' }}>
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="sold">Sold</option>
          <option value="removed">Removed</option>
        </select>
        <span className="mono tiny muted" style={{ marginLeft: 'auto' }}>{listings.length} ads</span>
      </div>

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr><th>Ad</th><th>Seller</th><th>Price</th><th>Specs</th><th>Status</th><th>Comments</th><th>Posted</th><th></th></tr>
          </thead>
          <tbody>
            {listings.length === 0 && <tr><td colSpan={8}>No ads found.</td></tr>}
            {listings.map((l) => (
              <tr key={l.id}>
                <td>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', maxWidth: 280 }}>
                    <img src={l.cover || 'https://picsum.photos/seed/fm/60/60'} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover' }} />
                    <strong style={{ lineHeight: 1.2 }}>{l.title}</strong>
                  </div>
                </td>
                <td>{l.seller_name}</td>
                <td className="mono">{fmtMoney(l.price_cents, l.currency)}</td>
                <td><span className="tiny mono">{l.hair_type} · {l.texture}</span></td>
                <td>
                  {l.status === 'sold' ? <span className="pill pill-red">Sold</span>
                    : l.status === 'removed' ? <span className="pill pill-muted">Removed</span>
                    : <span className="pill pill-green">Active</span>}
                </td>
                <td className="mono">{l.comment_count}</td>
                <td className="tiny mono">{fmtDate(l.created_at)}</td>
                <td>
                  <div className="row-actions">
                    <a href={`/marketplace/${l.id}`} target="_blank" rel="noreferrer" style={{ border: '1px solid var(--line)', borderRadius: 6, padding: '6px 10px', display: 'inline-flex', color: 'var(--pine-700)' }}><Eye size={14} /></a>
                    {l.status === 'active'
                      ? <button onClick={() => changeStatus(l, 'sold')}><CheckCircle2 size={14} /></button>
                      : <button onClick={() => changeStatus(l, 'active')}><RotateCcw size={14} /></button>}
                    <button className="danger" onClick={() => remove(l)}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
