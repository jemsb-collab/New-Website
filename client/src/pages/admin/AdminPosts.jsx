import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Pencil, Trash2, Eye, Lock } from 'lucide-react';
import { api, fmtViews } from '../../api';
import Modal from '../../components/Modal';

const EMPTY = {
  title: '', description: '', category_id: '', youtube_link: '', telegram_link: '',
  drive_link: '', thumbnail_url: '', is_premium: false, price_cents: '', is_published: true,
};

export default function AdminPosts() {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const PER = 20;

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: PER, offset: page * PER, sort: 'latest' });
    if (search) params.set('search', search);
    if (category) params.set('categoryId', category);
    const d = await api(`/api/admin/posts?${params}`);
    setPosts(d.posts);
    setTotal(d.total);
    setLoading(false);
  }, [search, category, page]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    api('/api/admin/categories').then((d) => setCategories(d.categories)).catch(() => {});
  }, []);

  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(''), 1800); };

  const openNew = () => {
    setEditing(null);
    setForm({ ...EMPTY, category_id: categories[0]?.id || '' });
    setError('');
    setModalOpen(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({
      title: p.title, description: p.description || '', category_id: p.category_id || '',
      youtube_link: p.youtube_link || '', telegram_link: p.telegram_link || '',
      drive_link: p.drive_link || '', thumbnail_url: p.thumbnail_url || '',
      is_premium: p.is_premium, price_cents: p.price_cents || '', is_published: p.is_published,
    });
    setError('');
    setModalOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const payload = {
      ...form,
      category_id: form.category_id ? Number(form.category_id) : null,
      price_cents: form.price_cents ? Number(form.price_cents) : null,
    };
    try {
      await api(editing ? `/api/admin/posts/${editing.id}` : '/api/admin/posts', {
        method: editing ? 'PUT' : 'POST',
        body: payload,
      });
      setModalOpen(false);
      notify(editing ? 'Entry updated.' : 'Entry published.');
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (p) => {
    if (!window.confirm(`Remove “${p.title}”? This also deletes its likes, notes and saves.`)) return;
    await api(`/api/admin/posts/${p.id}`, { method: 'DELETE' });
    notify('Entry removed.');
    load();
  };

  return (
    <>
      <p className="eyebrow">Content</p>
      <h1 className="serif">Studio entries</h1>

      <div className="toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid var(--line)', borderRadius: 8, padding: '0 10px', background: 'var(--white)' }}>
          <Search size={15} style={{ color: 'var(--muted)' }} />
          <input type="text" placeholder="Search title, text…" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }} style={{ border: 'none', outline: 'none', padding: '9px 4px' }} />
        </div>
        <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(0); }}>
          <option value="">All collections</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button className="btn btn-primary" onClick={openNew}><Plus size={16} /> New entry</button>
        <span className="mono tiny muted" style={{ marginLeft: 'auto' }}>{total} entries</span>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Entry</th><th>Collection</th><th>Views</th><th>Media</th><th>Status</th><th>Updated</th><th></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={7}>Loading…</td></tr>}
            {!loading && posts.length === 0 && <tr><td colSpan={7}>No entries match.</td></tr>}
            {!loading && posts.map((p) => (
              <tr key={p.id}>
                <td>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', maxWidth: 300 }}>
                    <img
                      src={p.thumbnail_url || 'https://picsum.photos/seed/fm/60/60'}
                      alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', flex: 'none' }}
                    />
                    <div>
                      <strong style={{ display: 'block', lineHeight: 1.2 }}>{p.title}</strong>
                      <span className="tiny muted">#{String(p.id).padStart(4, '0')}</span>
                    </div>
                  </div>
                </td>
                <td>{p.category_name || '—'}</td>
                <td className="mono">{fmtViews(p.view_count)}</td>
                <td>
                  <span className="tiny mono" style={{ whiteSpace: 'nowrap' }}>
                    {p.youtube_link ? 'YT · ' : ''}{p.telegram_link ? 'TG · ' : ''}{p.drive_link ? 'Drive' : ''}{!p.youtube_link && !p.telegram_link && !p.drive_link ? '—' : ''}
                  </span>
                </td>
                <td>
                  {p.is_premium && <span className="pill pill-amber" style={{ marginRight: 4 }}><Lock size={10} style={{ verticalAlign: -1 }} /> Signature</span>}
                  {p.is_published ? <span className="pill pill-green">Live</span> : <span className="pill pill-muted">Draft</span>}
                </td>
                <td className="tiny mono">{p.updated_at?.slice(0, 10)}</td>
                <td>
                  <div className="row-actions">
                    <a href={`/post/${p.id}`} target="_blank" rel="noreferrer" style={{ border: '1px solid var(--line)', borderRadius: 6, padding: '6px 10px', display: 'inline-flex', color: 'var(--pine-700)' }}>
                      <Eye size={14} />
                    </a>
                    <button onClick={() => openEdit(p)}><Pencil size={14} /></button>
                    <button className="danger" onClick={() => remove(p)}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="load-more" style={{ justifyContent: 'flex-start' }}>
        {page > 0 && <button className="btn btn-ghost" onClick={() => setPage(page - 1)}>Previous</button>}
        {(page + 1) * PER < total && <button className="btn btn-dark" onClick={() => setPage(page + 1)}>Next</button>}
        <span className="mono tiny muted" style={{ marginLeft: 12, alignSelf: 'center' }}>Page {page + 1}</span>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit entry' : 'New entry'}>
        <form onSubmit={submit}>
          <div className="field">
            <label>Title *</label>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="A clear, editorial title" />
          </div>
          <div className="field">
            <label>Description</label>
            <textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short studio copy — separate paragraphs with a blank line." />
          </div>
          <div className="field">
            <label>Collection</label>
            <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
              <option value="">None</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field">
              <label>YouTube link</label>
              <input value={form.youtube_link} onChange={(e) => setForm({ ...form, youtube_link: e.target.value })} placeholder="https://youtube.com/watch?v=…" />
            </div>
            <div className="field">
              <label>Telegram link</label>
              <input value={form.telegram_link} onChange={(e) => setForm({ ...form, telegram_link: e.target.value })} placeholder="https://t.me/…" />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field">
              <label>Google Drive link</label>
              <input value={form.drive_link} onChange={(e) => setForm({ ...form, drive_link: e.target.value })} placeholder="https://drive.google.com/file/d/…" />
            </div>
            <div className="field">
              <label>Thumbnail URL</label>
              <input value={form.thumbnail_url} onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })} placeholder="Auto-set from YouTube if empty" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: '0.9rem', fontWeight: 600 }}>
              <input type="checkbox" checked={form.is_premium} onChange={(e) => setForm({ ...form, is_premium: e.target.checked })} />
              Signature (premium) — reserved for the future paywall
            </label>
            {form.is_premium && (
              <div className="field" style={{ margin: 0, width: 130 }}>
                <label>Price (cents)</label>
                <input type="number" min="0" value={form.price_cents} onChange={(e) => setForm({ ...form, price_cents: e.target.value })} placeholder="999" />
              </div>
            )}
          </div>

          <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: '0.9rem', fontWeight: 600, marginBottom: 18 }}>
            <input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} />
            Published (visible in the feed)
          </label>

          {error && <div className="alert alert-error">{error}</div>}
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Publish entry'}</button>
          </div>
        </form>
      </Modal>

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
