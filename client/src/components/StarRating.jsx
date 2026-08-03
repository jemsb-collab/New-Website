import { Star } from 'lucide-react';

export default function StarRating({ value, size = 14, onChange, readonly = true }) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <span className="stars" style={{ display: 'inline-flex', gap: 2 }}>
      {stars.map((s) => (
        <button
          key={s}
          type="button"
          disabled={readonly}
          onClick={() => onChange && onChange(s)}
          className={readonly ? 'star-r' : 'star-r star-btn'}
          style={{
            background: 'none', border: 'none', padding: 0,
            color: s <= Math.round(value || 0) ? 'var(--brass)' : 'var(--line)',
            cursor: readonly ? 'default' : 'pointer',
          }}
          aria-label={`${s} star${s > 1 ? 's' : ''}`}
        >
          <Star size={size} fill="currentColor" />
        </button>
      ))}
    </span>
  );
}
