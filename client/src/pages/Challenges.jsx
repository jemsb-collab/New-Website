import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Users, CalendarDays, Plus } from 'lucide-react';
import { api, fmtDate } from '../api';
import { useAuth } from '../AuthContext';
import Modal from '../components/Modal';
import { SectionEmpty } from '../components/CategoryNav';

export default function Challenges() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', duration_days: 30, goal: '', image_url: '', category_id: '' });
  const [categories, setCategories] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    api('/api/challenges').then((d) => setChallenges(d.challenges)).catch(() => {});
  };
  useEffect(load, []);

  useEffect(() => {
    api('/api/categories').then((d) => setCategories(d.categories)).catch(() => {});
  }, []);

  const toggleJoin = async (ch) => {
    if (!user) return;
    const d = await api(`/api/challenges/${ch.id}/join`, { method: 'POST' });
    setChallenges((cs) => cs.map((c) => (c.id === ch.id ? { ...c, is_joined: d.joined, participant_count: d.participant_count } : c)));
  };

  const create = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api('/api/challenges', { method: 'POST', body: { ...form, category_id: form.category_id ? Number(form.category_id) : null } });
      setModalOpen(false);
      setForm({ title: '', description: '', duration_days: 30, goal: '', image_url: '', category_id: '' });
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <section className="hero" style={{ paddingBottom: 0 }}>
        <div className="container" style={{ paddingBottom: 40 }}>
          <p className="eyebrow" style={{ color: 'var(--brass-soft)' }}>Community activities</p>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.4rem)', maxWidth: '18ch' }}>
            Grow it, style it, <em>prove it</em>.
          </h1>
          <p className="lede">
            Join challenges, post your progress, and let the community cheer you on.
            From 30-day growth runs to silk-care streaks — there's always something happening.
          </p>
          {user?.role === 'admin' && (
            <button className="btn btn-primary" style={{ marginTop: 26 }} onClick={() => setModalOpen(true)}>
              <Plus size={16} /> Create a challenge
            </button>
          )}
        </div>
      </section>

      <div className="container" style={{ paddingTop: 34 }}>
        <div className="sec-head">
          <div>
            <p className="eyebrow">Active &amp; upcoming</p>
            <h2>Challenges</h2>
          </div>
        </div>

        {challenges.length === 0 ? (
          <SectionEmpty icon={Trophy} text="No challenges running right now. Check back soon." />
        ) : (
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
            {challenges.map((ch) => (
              <article className="card" key={ch.id}>
                {ch.image_url && (
                  <Link to={`/challenges/${ch.id}`} className="card-thumb" style={{ aspectRatio: '16/9' }}>
                    <img src={ch.image_url} alt={ch.title} loading="lazy" />
                  </Link>
                )}
                <div className="card-body">
                  <h3 className="card-title"><Link to={`/challenges/${ch.id}`}>{ch.title}</Link></h3>
                  <p className="muted tiny" style={{ margin: '0 0 12px' }}>{ch.description}</p>
                  <div className="card-meta" style={{ marginBottom: 14, flexWrap: 'wrap', gap: 6 }}>
                    <span><Users size={13} /> {ch.participant_count} joined</span>
                    <span><CalendarDays size={13} /> {ch.duration_days} days</span>
                    <span className="mono tiny">{ch.category_name || 'All hair'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {user ? (
                      <button
                        className={`btn ${ch.is_joined ? 'btn-primary' : 'btn-dark'} btn-sm`}
                        onClick={() => toggleJoin(ch)}
                      >
                        <Trophy size={14} /> {ch.is_joined ? 'Joined' : 'Join'}
                      </button>
                    ) : (
                      <Link to="/signup" className="btn btn-dark btn-sm"><Trophy size={14} /> Join</Link>
                    )}
                    <Link to={`/challenges/${ch.id}`} className="btn btn-ghost btn-sm">See progress</Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create a challenge">
        <form onSubmit={create}>
          <div className="field">
            <label>Title *</label>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. 30-Day Silk Hair Streak" />
          </div>
          <div className="field">
            <label>Description</label>
            <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field">
              <label>Duration (days)</label>
              <input type="number" min="1" value={form.duration_days} onChange={(e) => setForm({ ...form, duration_days: e.target.value })} />
            </div>
            <div className="field">
              <label>Collection</label>
              <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                <option value="">All hair</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="field">
            <label>Goal</label>
            <input value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })} placeholder="e.g. 2cm of new growth, no heat, weekly masks" />
          </div>
          <div className="field">
            <label>Cover image URL</label>
            <input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://…" />
          </div>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Creating…' : 'Create challenge'}</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
