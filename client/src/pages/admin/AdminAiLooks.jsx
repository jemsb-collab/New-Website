import { useEffect, useState } from 'react';
import { Trash2, CheckCircle2, Clock, XCircle, Search } from 'lucide-react';
import { api, fmtDate } from '../../api';

export default function AdminAiLooks() {
  const [looks, setLooks] = useState([]);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');

  const load = () => {
    api(`/api/admin/ai-looks?status=${status}`).then((d) => {
      const q = search.toLowerCase();
      setLooks(d.looks.filter((l) => !q || l.title.toLowerCase().includes(q)));
    }).catch(() => {});
  };
  useEffect(load, [status, search]);

  const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 1800); };

  const changeStatus = async (l, s) => {
    await api(`/api/admin/ai-looks/${l.id}`, { method: 'PATCH', body: { status: s } });
    notify(`Look ${s}.`);
    load();
  };

  const remove = async (l) => {
    if (!window.confirm(`Remove AI look “${l.title}”?`)) return;
    await api(`/api/admin/ai-looks/${l.id}`, { method: 'DELETE' });
    notify('Look removed.');
    load();
  };

  return (
    <>
      <p className="eyebrow">AI Studio</p>
      <h1 className="serif">AI looks</h1>

      <div className="toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid var(--line)', borderRadius: 8, padding: '0 10px', background: 'var(--white)' }}>
          <Search size={15} style={{ color: 'var(--muted)' }} />
          <input type="text" placeholder="Search looks…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ border: 'none', outline: 'none', padding: '9px 4px' }} />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ border: '1px solid var(--line)', borderRadius: 8, padding: '9px 12px', background: 'var(--white)' }}>
          <option value="all">All</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>
        <span className="mono tiny muted" style={{ marginLeft: 'auto' }}>{looks.length} looks</span>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
        {looks.length === 0 && <div className="empty">No AI looks.</div>}
        {looks.map((l) => (
          <div className="card" key={l.id}>
            <div className="card-thumb" style={{ aspectRatio: '4/5' }}>
              <img src={l.image_url} alt={l.title} loading="lazy" />
            </div>
            <div className="card-body">
              <h3 className="card-title" style={{ fontSize: '0.95rem', marginBottom: 6 }}>{l.title}</h3>
              <div className="card-meta" style={{ marginBottom: 10 }}>
                <span className="tiny muted">by {l.created_by_name || '—'} · {fmtDate(l.created_at)}</span>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                {l.status === 'approved' && <span className="pill pill-green">Approved</span>}
                {l.status === 'pending' && <span className="pill pill-amber">Pending</span>}
                {l.status === 'rejected' && <span className="pill pill-red">Rejected</span>}
              </div>
              <div className="row-actions" style={{ justifyContent: 'flex-start' }}>
                {l.status !== 'approved' && <button onClick={() => changeStatus(l, 'approved')}><CheckCircle2 size={14} /> Approve</button>}
                {l.status !== 'pending' && <button onClick={() => changeStatus(l, 'pending')}><Clock size={14} /> Hold</button>}
                {l.status !== 'rejected' && <button className="danger" onClick={() => changeStatus(l, 'rejected')}><XCircle size={14} /> Reject</button>}
                <button className="danger" onClick={() => remove(l)}><Trash2 size={14} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
