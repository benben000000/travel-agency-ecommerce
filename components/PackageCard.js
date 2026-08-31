import Link from 'next/link';

export default function PackageCard({ pkg }) {
  const price = pkg.price_amount ? (pkg.price_amount / 100).toFixed(0) : '0';
  const primaryImage = pkg.primary_image || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80';

  return (
    <Link
      href={`/packages/${pkg.slug}`}
      className="card package-card-lift"
      style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column' }}
    >
      <div className="card-image-wrap">
        <img
          src={primaryImage}
          alt={pkg.title}
          className="card-image"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80';
          }}
        />
        {pkg.featured === 1 && (
          <div
            style={{
              position: 'absolute',
              top: '14px',
              left: '14px',
              background: 'var(--color-primary-dark)',
              color: '#ffffff',
              padding: '4px 12px',
              fontSize: '0.75rem',
              fontFamily: 'var(--font-heading)',
              fontWeight: '700',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              borderRadius: 'var(--radius-pill)',
            }}
          >
            Featured
          </div>
        )}
      </div>

      <div className="card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--color-primary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {pkg.destination || 'Global Journey'}
          </span>
          {pkg.avg_rating > 0 ? (
            <span style={{ fontSize: '0.85rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <span style={{ color: '#eab308' }}>★</span> {Number(pkg.avg_rating).toFixed(1)} ({pkg.review_count})
            </span>
          ) : (
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', fontWeight: '600' }}>
              New Tour
            </span>
          )}
        </div>

        <h3 className="card-title">{pkg.title}</h3>

        <p className="card-text" style={{ flex: 1 }}>
          {pkg.short_description || 'Expertly planned itinerary with certified local guides and premium accommodations.'}
        </p>

        <div className="card-meta" style={{ paddingBottom: '14px', borderBottom: '1px solid var(--color-border)' }}>
          <span>{pkg.duration_days} Day{pkg.duration_days !== 1 ? 's' : ''}{pkg.duration_nights ? ` / ${pkg.duration_nights} Night${pkg.duration_nights !== 1 ? 's' : ''}` : ''}</span>
          <span>Max {pkg.max_guests || 10} Guests</span>
        </div>

        <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="card-price">
            ${price} <span>/ {pkg.price_per || 'person'}</span>
          </div>
          <span className="btn btn-secondary btn-sm">
            View Details
          </span>
        </div>
      </div>
    </Link>
  );
}
