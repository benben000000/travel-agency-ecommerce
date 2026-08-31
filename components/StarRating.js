'use client';

export function StarRating({ value, onChange, readonly = false }) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <span className={readonly ? 'star-display' : 'star-rating'}>
      {stars.map((s) => (
        <i
          key={s}
          className={`star ${s <= value ? 'filled' : ''}`}
          onClick={() => !readonly && onChange && onChange(s)}
          style={readonly ? { cursor: 'default' } : {}}
        >
          {s <= value ? '\u2605' : '\u2606'}
        </i>
      ))}
    </span>
  );
}

export default StarRating;
