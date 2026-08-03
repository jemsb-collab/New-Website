import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { api } from '../../api';
import Modal from '../../components/Modal';

export default function AdminCategories() {
  const [cats, setCats] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', slug: '', description: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const load = () => {
    api('/api/admin/categories').then((d) => setCats(d.categories)).catch(() => {});
  };
  useEffect(load, []);

  const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 1800); };

  const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', slug: '', description: '' });
    setError('');
    setModalOpen(true);
  };
  const openEdit = (c) => {
    setEditing(c);
    setForm({ name: c.name, slug: c.slug, description: c.description || '' });
    setError('');
    setModalOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const payload = { ...form, slug: form.slug || slugify(form.name) };
      await api(editing ? `/api/admin/categories/${editing.id}` : '/api/admin/categories', {
        method: editing ? 'PUT' : 'POST', body: payload,
      });
      setModalOpen(false);
      notify(editing ? 'Collection updated.' : 'Collection created.');
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (c) => {
    if (!window.confirm(`Remove “${c.name}”? Its entries will become unassigned.`)) return;
    await api(`/api/admin/categories/${c.id}`, { method: 'DELETE' });
    notify('Collection removed.');
    load();
  };

  return (
    <>
      <p className="eyebrow">Taxonomy</p>
      <h1 className="serif">Collections</h1>

      <div className="toolbar">
        <button className="btn btn-primary" onClick={openNew}><Plus size={16} /> New collection</button>
        <span className="mono tiny muted" style={{ marginLeft: 'auto' }}>{cats.length} collections</span>
      </div>

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr><th>Collection</th><th>Slug</th><th>Entries</th><th>Followers</th><th>Description</th><th></th></tr>
          </thead>
          <tbody>
            {cats.map((c) => (
              <tr key={c.id}>
                <td><strong>{c.name}</strong></td>
                <td className="mono tiny">{c.slug}</td>
                <td className="mono">{c.post_count}</td>
                <td className="mono">{c.follower_count}</td>
                <td style={{ maxWidth: 320 }}><span className="tiny muted">{c.description || '—'}</span></td>
                <td>
                  <div className="row-actions">
                    <button onClick={() => openEdit(c)}><Pencil size={14} /></button>
                    <button className="danger" onClick={() => remove(c)}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit collection' : 'New collection'}>
        <form onSubmit={submit}>
          <div className="field">
            <label>Name *</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Long Hair" />
          </div>
          <div className="field">
            <label>Slug</label>
            <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="long-hair (auto-generated from name)" />
          </div>
          <div className="field">
            <label>Description</label>
            <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="One sentence about the collection." />
          </div>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Create collection'}</button>
          </div>
        </form>
      </Modal>

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
