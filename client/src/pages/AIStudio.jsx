import { useEffect, useState } from 'react';
import { Sparkles, Heart, Upload, Wand2, Play } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import Modal from '../components/Modal';
import { SectionEmpty } from '../components/CategoryNav';

export default function AIStudio() {
  const { user } = useAuth();
  const [looks, setLooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [styles, setStyles] = useState([]);
  const [cat, setCat] = useState('');
  const [genOpen, setGenOpen] = useState(false);
  const [subOpen, setSubOpen] = useState(false);
  const [genStyle, setGenStyle] = useState('');
  const [genResult, setGenResult] = useState(null);
  const [genBusy, setGenBusy] = useState(false);
  const [form, setForm] = useState({ title: '', image_url: '', video_url: '', prompt: '', category_id: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const load = () => {
    api(`/api/ai/looks${cat ? `?category=${cat}` : ''}`).then((d) => setLooks(d.looks)).catch(() => {});
  };
  useEffect(load, [cat]);

  useEffect(() => {
    api('/api/categories').then((d) => setCategories(d.categories)).catch(() => {});
    api('/api/ai/styles').then((d) => setStyles(d.styles)).catch(() => {});
  }, []);

  const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 2000); };

  const toggleLike = async (look) => {
    if (!user) { notify('Sign in to like looks.'); return; }
    const d = await api(`/api/ai/looks/${look.id}/like`, { method: 'POST' });
    setLooks((ls) => ls.map((l) => (l.id === look.id ? { ...l, is_liked: d.liked, like_count: d.like_count } : l)));
  };

  const generate = async () => {
    setGenBusy(true);
    setGenResult(null);
    const targetCat = styles.find((s) => s.key === genStyle)?.label || '';
    const pool = looks.filter((l) => !cat || l.category_name === cat);
    const sample = pool[Math.floor(Math.random() * pool.length)] || looks[Math.floor(Math.random() * looks.length)];
    await new Promise((r) => setTimeout(r, 900));
    setGenResult({ image: sample?.image_url, label: targetCat || 'your chosen style' });
    setGenBusy(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const d = await api('/api/ai/looks', {
        method: 'POST',
        body: { ...form, category_id: form.category_id ? Number(form.category_id) : null },
      });
      setSubOpen(false);
      setForm({ title: '', image_url: '', video_url: '', prompt: '', category_id: '' });
      notify(d.status === 'approved' ? 'Your AI look is live in the gallery.' : 'Submitted — an admin will approve it shortly.');
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
          <p className="eyebrow" style={{ color: 'var(--brass-soft)' }}>FM AI Studio</p>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.4rem)', maxWidth: '18ch' }}>
            Try a new look, <em>before the scissors</em>.
          </h1>
          <p className="lede">
            Browse AI-generated hair transformations, preview how a style sits on real textures,
            and submit your own AI-crafted looks to the community gallery.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 26 }}>
            <button className="btn btn-brass" onClick={() => { setGenStyle(''); setGenResult(null); setGenOpen(true); }}>
              <Wand2 size={16} /> Try a style
            </button>
            {user && (
              <button className="btn btn-ghost" style={{ borderColor: 'rgba(242,238,227,0.4)', color: 'var(--ivory)' }} onClick={() => setSubOpen(true)}>
                <Upload size={16} /> Submit an AI look
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="cat-bar">
        <div className="cat-scroll">
          <button className={`cat-chip ${!cat ? 'active' : ''}`} onClick={() => setCat('')}>All looks</button>
          {categories.map((c) => (
            <button key={c.id} className={`cat-chip ${cat === c.slug ? 'active' : ''}`} onClick={() => setCat(c.slug)}>
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="container" style={{ paddingTop: 30 }}>
        <div className="sec-head">
          <div>
            <p className="eyebrow">Community gallery</p>
            <h2>AI hair looks</h2>
          </div>
          <span className="meta">{looks.length} looks</span>
        </div>

        {looks.length === 0 ? (
          <SectionEmpty icon={Sparkles} text="No AI looks yet. Submit the first one." />
        ) : (
          <div className="grid grid-feed">
            {looks.map((l) => (
              <article className="card" key={l.id}>
                <div className="card-thumb" style={{ aspectRatio: '4/5' }}>
                  <img src={l.image_url} alt={l.title} loading="lazy" />
                  {l.video_url && (
                    <span className="views-chip" style={{ left: 12, right: 'auto', bottom: 'auto', top: 12 }}>
                      <Play size={10} style={{ verticalAlign: -1 }} /> Video
                    </span>
                  )}
                  <button
                    className={`icon-btn views-chip ${l.is_liked ? 'active' : ''}`}
                    style={{ background: 'rgba(20,26,23,0.6)', bottom: 12 }}
                    onClick={() => toggleLike(l)}
                    aria-label="Like"
                  >
                    <Heart size={14} fill={l.is_liked ? 'currentColor' : 'none'} />
                    <span style={{ marginLeft: 4 }}>{l.like_count}</span>
                  </button>
                </div>
                <div className="card-body">
                  <h3 className="card-title" style={{ fontSize: '0.98rem', marginBottom: 6 }}>{l.title}</h3>
                  <div className="card-meta">
                    <span className="mono tiny">{l.category_name || 'AI look'}</span>
                    <span className="tiny muted">by {l.created_by_name}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <Modal open={genOpen} onClose={() => setGenOpen(false)} title="Try a style">
        <p className="muted tiny">Pick the look you're dreaming about. We preview it against real textures from the studio gallery.</p>
        <div className="field">
          <label>Target style</label>
          <select value={genStyle} onChange={(e) => setGenStyle(e.target.value)}>
            <option value="">Choose a style…</option>
            {styles.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </div>
        {genStyle && (
          <div className="field">
            <p className="muted tiny" style={{ marginTop: -6 }}>{styles.find((s) => s.key === genStyle)?.blurb}</p>
          </div>
        )}
        <button className="btn btn-primary btn-block" disabled={!genStyle || genBusy} onClick={generate}>
          {genBusy ? 'Rendering preview…' : <><Wand2 size={15} /> Generate preview</>}
        </button>
        {genResult && (
          <div style={{ marginTop: 18, textAlign: 'center' }}>
            <img src={genResult.image} alt={genResult.label} style={{ width: '100%', maxWidth: 320, borderRadius: 14, margin: '0 auto' }} />
            <p className="tiny muted" style={{ marginTop: 10 }}>
              Concept preview — <strong>{genResult.label}</strong>. Like it? Save this style and browse the collection for the full look.
            </p>
          </div>
        )}
      </Modal>

      <Modal open={subOpen} onClose={() => setSubOpen(false)} title="Submit an AI look">
        <form onSubmit={submit}>
          <div className="field">
            <label>Title *</label>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Midnight silk bob — AI concept" />
          </div>
          <div className="field">
            <label>Image URL *</label>
            <input required type="url" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://…" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field">
              <label>Video URL (optional)</label>
              <input value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} placeholder="https://youtube.com/watch?v=…" />
            </div>
            <div className="field">
              <label>Collection</label>
              <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                <option value="">None</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="field">
            <label>Prompt (what did you generate?)</label>
            <textarea rows={3} value={form.prompt} onChange={(e) => setForm({ ...form, prompt: e.target.value })} placeholder="Describe the prompt behind this look…" />
          </div>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setSubOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Submitting…' : 'Submit look'}</button>
          </div>
        </form>
      </Modal>

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
