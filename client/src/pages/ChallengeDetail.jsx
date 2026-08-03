import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Trophy, Users, CalendarDays, Send, Target } from 'lucide-react';
import { api, fmtDate, initials } from '../api';
import { useAuth } from '../AuthContext';

export default function ChallengeDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updateText, setUpdateText] = useState('');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState('');

  const load = () => {
    api(`/api/challenges/${id}`).then((d) => { setData(d); document.title = d.challenge.title; })
      .catch((e) => setError(e.message)).finally(() => setLoading(false));
  };
  useEffect(load, [id]);

  const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 2000); };

  const toggleJoin = async () => {
    if (!user) { notify('Sign in to join.'); return; }
    const d = await api(`/api/challenges/${id}/join`, { method: 'POST' });
    setData((prev) => ({ ...prev, challenge: { ...prev.challenge, is_joined: d.joined, participant_count: d.participant_count } }));
    notify(d.joined ? 'You joined the challenge!' : 'You left the challenge.');
  };

  const postUpdate = async (e) => {
    e.preventDefault();
    if (!updateText.trim()) return;
    if (!user) { notify('Sign in to post updates.'); return; }
    setBusy(true);
    try {
      const u = await api(`/api/challenges/${id}/updates`, { method: 'POST', body: { body: updateText } });
      setData((prev) => ({ ...prev, updates: [u, ...prev.updates] }));
      setUpdateText('');
    } catch (err) {
      notify(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="spinner" />;
  if (error || !data) return (
    <div className="container" style={{ padding: '80px 0' }}>
      <div className="alert alert-error">{error || 'Challenge not found.'}</div>
      <Link to="/challenges" className="btn btn-dark">Back to challenges</Link>
    </div>
  );

  const { challenge, participants, updates } = data;

  return (
    <div className="detail-wrap" style={{ maxWidth: 880 }}>
      {toast && <div className="toast">{toast}</div>}
      <nav className="breadcrumb">
        <Link to="/">Feed</Link>
        <span>/</span>
        <Link to="/challenges">Challenges</Link>
        <span>/</span>
        <span>{challenge.title}</span>
      </nav>

      <div className="detail-sub">
        <span className="eyebrow">{challenge.category_name || 'All hair'}</span>
        <span className="sep">·</span>
        <span><CalendarDays size={14} style={{ verticalAlign: -2 }} /> {challenge.duration_days} days</span>
        <span className="sep">·</span>
        <span><Users size={14} style={{ verticalAlign: -2 }} /> {challenge.participant_count} joined</span>
      </div>
      <h1 className="serif">{challenge.title}</h1>
      <p className="muted" style={{ maxWidth: '60ch' }}>{challenge.description}</p>

      {challenge.goal && (
        <div className="panel" style={{ margin: '18px 0' }}>
          <h3 className="serif" style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Target size={15} style={{ color: 'var(--brass)' }} /> The goal
          </h3>
          <p style={{ margin: 0 }}>{challenge.goal}</p>
        </div>
      )}

      {user && (
        <button className={`btn ${challenge.is_joined ? 'btn-primary' : 'btn-dark'}`} onClick={toggleJoin}>
          <Trophy size={15} /> {challenge.is_joined ? 'Joined — leave challenge' : 'Join this challenge'}
        </button>
      )}

      <section style={{ marginTop: 36 }}>
        <h3 className="serif">Progress updates</h3>
        <form className="comment-form" onSubmit={postUpdate}>
          <textarea
            value={updateText}
            onChange={(e) => setUpdateText(e.target.value)}
            placeholder={challenge.is_joined ? 'Day 12 — 1.5cm growth. Weekly mask worked…' : 'Join the challenge to post progress updates.'}
            disabled={!user || !challenge.is_joined}
          />
          {user && challenge.is_joined && (
            <button className="btn btn-primary" disabled={busy || !updateText.trim()} style={{ borderRadius: 12 }}>
              <Send size={15} />
            </button>
          )}
        </form>
        {updates.length === 0 && <p className="muted tiny">No updates yet — be the first to share progress.</p>}
        {updates.map((u) => (
          <div className="comment" key={u.id}>
            {u.user_avatar ? <img className="avatar" src={u.user_avatar} alt="" /> : <span className="avatar">{initials(u.user_name)}</span>}
            <div className="body">
              <span className="author">{u.user_name}</span>
              <span className="when">{fmtDate(u.created_at)}</span>
              <p className="text">{u.body}</p>
              {u.image_url && <img src={u.image_url} alt="" style={{ borderRadius: 10, maxWidth: 260, marginTop: 8 }} />}
            </div>
          </div>
        ))}
      </section>

      <section style={{ marginTop: 36 }}>
        <h3 className="serif">Who's in ({participants.length})</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {participants.map((p) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid var(--line)', borderRadius: 999, padding: '6px 14px 6px 6px' }}>
              {p.avatar_url ? <img className="avatar" src={p.avatar_url} alt="" style={{ width: 28, height: 28 }} /> : <span className="avatar" style={{ width: 28, height: 28, fontSize: '0.7rem' }}>{initials(p.name)}</span>}
              <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{p.name}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
