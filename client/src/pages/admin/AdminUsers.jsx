import { useEffect, useState } from 'react';
import { Search, Ban, ShieldCheck, Trash2 } from 'lucide-react';
import { api, initials, fmtDate } from '../../api';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');

  const load = () => {
    api(`/api/admin/users?search=${encodeURIComponent(search)}`).then((d) => setUsers(d.users)).catch(() => {});
  };
  useEffect(load, [search]);

  const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 1800); };

  const patch = async (u, body, msg) => {
    await api(`/api/admin/users/${u.id}`, { method: 'PATCH', body });
    notify(msg);
    load();
  };

  const remove = async (u) => {
    if (!window.confirm(`Remove member “${u.name}” (${u.email})? This deletes their profile, notes, likes and saves.`)) return;
    await api(`/api/admin/users/${u.id}`, { method: 'DELETE' });
    notify('Member removed.');
    load();
  };

  return (
    <>
      <p className="eyebrow">Community</p>
      <h1 className="serif">Members</h1>

      <div className="toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid var(--line)', borderRadius: 8, padding: '0 10px', background: 'var(--white)' }}>
          <Search size={15} style={{ color: 'var(--muted)' }} />
          <input type="text" placeholder="Search by name or email…" value={search}
            onChange={(e) => setSearch(e.target.value)} style={{ border: 'none', outline: 'none', padding: '9px 4px' }} />
        </div>
        <span className="mono tiny muted" style={{ marginLeft: 'auto' }}>{users.length} shown</span>
      </div>

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Member</th><th>Role</th><th>Status</th><th>Joined</th>
              <th>Notes</th><th>Likes</th><th>Saves</th><th></th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && <tr><td colSpan={8}>No members found.</td></tr>}
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    {u.avatar_url ? (
                      <img className="avatar" src={u.avatar_url} alt="" />
                    ) : (
                      <span className="avatar" style={{ width: 32, height: 32, fontSize: '0.75rem' }}>{initials(u.name)}</span>
                    )}
                    <div>
                      <strong style={{ display: 'block' }}>{u.name}</strong>
                      <span className="tiny muted">{u.email}</span>
                    </div>
                  </div>
                </td>
                <td>{u.role === 'admin' ? <span className="pill pill-amber">Admin</span> : <span className="pill pill-muted">Member</span>}</td>
                <td>{u.is_banned ? <span className="pill pill-red">Banned</span> : <span className="pill pill-green">Active</span>}</td>
                <td className="tiny mono">{fmtDate(u.created_at)}</td>
                <td className="mono">{u.comment_count}</td>
                <td className="mono">{u.like_count}</td>
                <td className="mono">{u.save_count}</td>
                <td>
                  <div className="row-actions">
                    <button
                      title={u.role === 'admin' ? 'Remove admin' : 'Make admin'}
                      onClick={() => patch(u, { role: u.role === 'admin' ? 'viewer' : 'admin' }, u.role === 'admin' ? 'Admin rights removed.' : 'Promoted to admin.')}
                    >
                      <ShieldCheck size={14} />
                    </button>
                    <button
                      className={u.is_banned ? '' : 'danger'}
                      title={u.is_banned ? 'Unban' : 'Ban'}
                      onClick={() => patch(u, { is_banned: !u.is_banned }, u.is_banned ? 'Member unbanned.' : 'Member banned.')}
                    >
                      <Ban size={14} />
                    </button>
                    <button className="danger" title="Remove" onClick={() => remove(u)}>
                      <Trash2 size={14} />
                    </button>
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
