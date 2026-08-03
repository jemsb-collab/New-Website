import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Scissors, Search } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import ListingCard from '../components/ListingCard';
import Modal from '../components/Modal';
import { PostSkeleton, SectionEmpty } from '../components/CategoryNav';

const HAIR_TYPES = ['Virgin Hair', 'Remy Hair', 'Human Hair', 'Synthetic', 'Bundle', 'Closure'];
const TEXTURES = ['Silky Straight', 'Body Wave', 'Deep Wave', 'Curly', 'Kinky Straight', 'Natural'];

const EMPTY_FORM = {
  title: '', description: '', hair_type: 'Virgin Hair', texture: 'Silky Straight', color: 'Black',
  length_cm: '', weight_grams: '', price_cents: '', photos: '',
};

export default function Marketplace() {
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [hairType, setHairType] = useState('');
  const [texture, setTexture] = useState('');
  const [sort, setSort] = useState('latest');
  const [status, setStatus] = useState('active');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams({ sort, status, limit: 30 });
    if (search) params.set('search', search);
    if (hairType) params.set('hair_type', hairType);
    if (texture) params.set('texture', texture);
    const d = await api(`/api/marketplace?${params}`);
    setListings(d.listings);
    setTotal(d.total);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [sort, status, hairType, texture, search]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const photos = form.photos.split('\n').map((s) => s.trim()).filter(Boolean);
      await api('/api/marketplace', {
        method: 'POST',
        body: {
          ...form,
          length_cm: form.length_cm ? Number(form.length_cm) : null,
          weight_grams: form.weight_grams ? Number(form.weight_grams) : null,
          price_cents: Number(form.price_cents) || 0,
          photos,
        },
      });
      setModalOpen(false);
      setForm(EMPTY_FORM);
      setToast('Your ad is live on the marketplace.');
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
          <p className="eyebrow" style={{ color: 'var(--brass-soft)' }}>The marketplace</p>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.4rem)', maxWidth: '18ch' }}>
            Buy and sell hair, <em>face to face</em>.
          </h1>
          <p className="lede">
            Post your hair for sale in minutes — virgin, remy, bundles or closures.
            Buyers comment to claim, sellers close the deal. No middleman, no fees.
          </p>
          <div className="hero-stats">
            <div className="hero-stat"><b>{total}</b><span>Live ads</span></div>
            <div className="hero-stat"><b>4.6★</b><span>Average seller rating</span></div>
            <div className="hero-stat"><b>1K+</b><span>Hair sold</span></div>
          </div>
          {user && (
            <button className="btn btn-primary" style={{ marginTop: 28 }} onClick={() => setModalOpen(true)}>
              <Plus size={16} /> Post a hair ad
            </button>
          )}
        </div>
      </section>

      <div className="cat-bar">
        <div className="cat-scroll">
          {['active', 'sold'].map((s) => (
            <button key={s} className={`cat-chip ${status === s ? 'active' : ''}`} onClick={() => setStatus(s)}>
              {s === 'active' ? 'For sale' : 'Recently sold'}
            </button>
          ))}
          <select value={hairType} onChange={(e) => setHairType(e.target.value)} className="cat-chip" style={{ background: 'transparent' }}>
            <option value="">All hair types</option>
            {HAIR_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={texture} onChange={(e) => setTexture(e.target.value)} className="cat-chip" style={{ background: 'transparent' }}>
            <option value="">All textures</option>
            {TEXTURES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="cat-chip" style={{ background: 'transparent' }}>
            <option value="latest">Newest first</option>
            <option value="price_low">Price low → high</option>
            <option value="price_high">Price high → low</option>
            <option value="popular">Most viewed</option>
          </select>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 30 }}>
        <div className="sec-head">
          <div>
            <p className="eyebrow">Hair marketplace</p>
            <h2>{status === 'active' ? 'Hair for sale' : 'Recently sold'}</h2>
          </div>
          <div className="toolbar" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid var(--line)', borderRadius: 8, padding: '0 10px', background: 'var(--ivory-50)' }}>
              <Search size={15} style={{ color: 'var(--muted)' }} />
              <input type="text" placeholder="Search ads…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ border: 'none', outline: 'none', padding: '8px 4px', background: 'transparent' }} />
            </div>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {!loading && listings.length === 0 && (
          <SectionEmpty icon={Scissors} text="No ads here yet. Be the first to post your hair for sale." />
        )}
        {loading && listings.length === 0 && <PostSkeleton count={8} />}
        {listings.length > 0 && (
          <div className="grid grid-feed">
            {listings.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        )}
        {!user && listings.length > 0 && (
          <div className="empty" style={{ padding: 30 }}>
            <p>Have hair to sell? <Link to="/signup" style={{ color: 'var(--copper)', fontWeight: 700 }}>Join FM</Link> and post your first ad in minutes.</p>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Post a hair ad">
        <form onSubmit={submit}>
          <div className="field">
            <label>Title *</label>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={'e.g. 22" Virgin Silky Straight bundle'} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field">
              <label>Hair type</label>
              <select value={form.hair_type} onChange={(e) => setForm({ ...form, hair_type: e.target.value })}>
                {HAIR_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Texture</label>
              <select value={form.texture} onChange={(e) => setForm({ ...form, texture: e.target.value })}>
                {TEXTURES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div className="field">
              <label>Colour</label>
              <input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} placeholder="Black" />
            </div>
            <div className="field">
              <label>Length (cm)</label>
              <input type="number" min="0" value={form.length_cm} onChange={(e) => setForm({ ...form, length_cm: e.target.value })} placeholder="55" />
            </div>
            <div className="field">
              <label>Weight (g)</label>
              <input type="number" min="0" value={form.weight_grams} onChange={(e) => setForm({ ...form, weight_grams: e.target.value })} placeholder="100" />
            </div>
          </div>
          <div className="field">
            <label>Price (USD) *</label>
            <input type="number" min="1" required value={form.price_cents} onChange={(e) => setForm({ ...form, price_cents: e.target.value })} placeholder="249" />
          </div>
          <div className="field">
            <label>Photos (image URLs, one per line)</label>
            <textarea rows={4} value={form.photos} onChange={(e) => setForm({ ...form, photos: e.target.value })} placeholder="https://…&#10;https://…" />
          </div>
          <div className="field">
            <label>Description</label>
            <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Origin, condition, what's included…" />
          </div>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Posting…' : 'Post ad'}</button>
          </div>
        </form>
      </Modal>

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
