import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="container" style={{ textAlign: 'center', padding: '90px 20px' }}>
      <Compass size={44} style={{ opacity: 0.4, margin: '0 auto 16px' }} />
      <h1 className="serif" style={{ fontSize: '2.4rem' }}>404 — off the set</h1>
      <p className="muted">This page does not exist. Head back to the studio feed.</p>
      <Link to="/" className="btn btn-dark" style={{ marginTop: 12 }}>Back to the feed</Link>
    </div>
  );
}
