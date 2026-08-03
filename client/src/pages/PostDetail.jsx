import { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Eye, MessageCircle, Heart, Bookmark, Share2, Send, Lock,
  Youtube, ExternalLink, Image as ImageIcon, Check,
} from 'lucide-react';
import { api, fmtViews, fmtDate, initials } from '../api';
import { useAuth } from '../AuthContext';

function youTubeEmbed(url) {
  const m = String(url || '').match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

function drivePreview(url) {
  let m = String(url || '').match(/drive\.google\.com\/file\/d\/([A-Za-z0-9_-]+)/);
  if (!m) m = String(url || '').match(/drive\.google\.com\/uc\?.*[?&]id=([A-Za-z0-9_-]+)/);
  return m ? `https://drive.google.com/file/d/${m[1]}/preview` : null;
}

function normalizeTg(url) {
  const s = String(url || '').trim();
  return s.startsWith('http') ? s : `https://${s}`;
}

export default function PostDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [commenting, setCommenting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [notLogged, setNotLogged] = useState(false);

  useEffect(() => {
    setLoading(true);
    api(`/api/posts/${id}`).then((d) => {
      setData(d);
      setLiked(!!d.post.is_liked);
      setSaved(!!d.post.is_saved);
      setLikeCount(d.post.like_count);
      document.title = `${d.post.title} — Filora Media`;
    }).catch((e) => {
      setError(e.message);
      document.title = 'Post — Filora Media';
    }).finally(() => setLoading(false));
  }, [id]);

  const needLogin = useCallback(() => {
    if (user) return false;
    setNotLogged(true);
    setTimeout(() => setNotLogged(false), 1800);
    return true;
  }, [user]);

  const toggleLike = async () => {
    if (needLogin()) return;
    const method = liked ? 'DELETE' : 'POST';
    const d = await api(`/api/posts/${id}/like`, { method });
    setLiked(d.liked);
    setLikeCount(d.like_count);
  };

  const toggleSave = async () => {
    if (needLogin()) return;
    const method = saved ? 'DELETE' : 'POST';
    const d = await api(`/api/posts/${id}/save`, { method });
    setSaved(d.saved);
  };

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: data.post.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch { /* dismissed */ }
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    if (needLogin()) return;
    setCommenting(true);
    try {
      const c = await api(`/api/posts/${id}/comments`, { method: 'POST', body: { body: commentText } });
      setData((d) => ({ ...d, comments: [c, ...d.comments], post: { ...d.post, comment_count: d.post.comment_count + 1 } }));
      setCommentText('');
    } finally {
      setCommenting(false);
    }
  };

  if (loading) return <div className="spinner" />;
  if (error || !data) return (
    <div className="container" style={{ padding: '80px 0' }}>
      <div className="alert alert-error">{error || 'Post not found.'}</div>
      <Link to="/" className="btn btn-dark">Back to the feed</Link>
    </div>
  );

  const { post, images, comments } = data;
  const ytEmbed = youTubeEmbed(post.youtube_link);
  const drvPreview = drivePreview(post.drive_link);
  const tgLink = post.telegram_link ? normalizeTg(post.telegram_link) : null;

  return (
    <div className="detail-wrap">
      {notLogged && <div className="toast">Sign in to like, save and comment.</div>}

      <nav className="breadcrumb">
        <Link to="/">Feed</Link>
        <span>/</span>
        <Link to={`/category/${post.category_slug}`}>{post.category_name || 'General'}</Link>
        <span>/</span>
        <span>Entry {String(post.id).padStart(4, '0')}</span>
      </nav>

      <h1 className="detail-title serif">{post.title}</h1>
      <div className="detail-sub">
        <span className="eyebrow">{post.category_name || 'General'}</span>
        <span className="sep">·</span>
        <span><Eye size={14} style={{ verticalAlign: -2 }} /> <span className="mono">{fmtViews(post.view_count)}</span> views</span>
        <span className="sep">·</span>
        <span>{fmtDate(post.created_at)}</span>
        {post.is_premium && (
          <span className="pill pill-amber"><Lock size={11} style={{ verticalAlign: -2 }} /> Signature collection</span>
        )}
      </div>

      <div className="media-frame">
        {ytEmbed ? (
          <iframe src={ytEmbed} title={post.title} allowFullScreen allow="autoplay; encrypted-media; picture-in-picture" />
        ) : drvPreview ? (
          <iframe src={drvPreview} title={post.title} allowFullScreen allow="autoplay" />
        ) : tgLink ? (
          <a className="link-out" href={tgLink} target="_blank" rel="noopener noreferrer">
            <Youtube size={30} />
            <h3>Watch in Telegram</h3>
            <p>This entry is hosted as a Telegram media link. It opens on Telegram — no login required to view.</p>
            <span className="btn btn-primary"><ExternalLink size={14} /> Open link</span>
          </a>
        ) : (
          <div className="link-out">
            <ImageIcon size={30} />
            <h3>Entry artwork</h3>
            <p>{post.thumbnail_url ? 'Preview below.' : 'No video attached to this entry yet.'}</p>
          </div>
        )}
      </div>

      <div className="media-strip">
        {post.youtube_link && (
          <a className="media-chip" href={post.youtube_link} target="_blank" rel="noopener noreferrer">
            <Youtube size={15} /> Watch on YouTube
          </a>
        )}
        {tgLink && (
          <a className="media-chip" href={tgLink} target="_blank" rel="noopener noreferrer">
            <Send size={15} /> Open in Telegram
          </a>
        )}
        {post.drive_link && (
          <a className="media-chip" href={post.drive_link} target="_blank" rel="noopener noreferrer">
            <ExternalLink size={15} /> View on Google Drive
          </a>
        )}
      </div>

      {images.length > 0 && (
        <div className="gallery">
          {images.map((im) => (
            <a key={im.id} href={im.image_url} target="_blank" rel="noopener noreferrer">
              <img src={im.image_url} alt={post.title} loading="lazy" />
            </a>
          ))}
        </div>
      )}

      <div className="detail-actions">
        <button className={`btn ${liked ? 'btn-primary' : 'btn-ghost'}`} onClick={toggleLike}>
          <Heart size={16} fill={liked ? 'currentColor' : 'none'} /> {liked ? 'Liked' : 'Like'}
        </button>
        <span className="engage-count">{fmtViews(likeCount)} likes</span>
        <button className="btn btn-ghost" onClick={toggleSave}>
          <Bookmark size={16} fill={saved ? 'currentColor' : 'none'} /> {saved ? 'Saved' : 'Save'}
        </button>
        <button className="btn btn-ghost" onClick={share}>
          {copied ? <Check size={16} /> : <Share2 size={16} />} {copied ? 'Link copied' : 'Share'}
        </button>
      </div>

      <div className="desc-block">
        {post.description.split('\n\n').map((p, i) => <p key={i}>{p}</p>)}
      </div>

      <section className="comments">
        <h3 className="serif">Community notes</h3>
        <form className="comment-form" onSubmit={submitComment}>
          {user && (user.avatar_url ? (
            <img className="avatar" src={user.avatar_url} alt="" />
          ) : (
            <span className="avatar">{initials(user.name)}</span>
          ))}
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder={user ? 'Share a thought…' : 'Sign in to join the conversation.'}
            disabled={!user}
          />
          {user && (
            <button className="btn btn-primary" disabled={commenting || !commentText.trim()} style={{ borderRadius: 12 }}>
              <Send size={15} />
            </button>
          )}
        </form>
        {comments.length === 0 && <p className="muted tiny">No notes yet — be the first.</p>}
        {comments.map((c) => (
          <div className="comment" key={c.id}>
            {c.user_avatar ? (
              <img className="avatar" src={c.user_avatar} alt="" />
            ) : (
              <span className="avatar">{initials(c.user_name)}</span>
            )}
            <div className="body">
              <span className="author">{c.user_name}</span>
              <span className="when">{fmtDate(c.created_at)}</span>
              <p className="text">{c.body}</p>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
