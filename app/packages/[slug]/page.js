'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { StarRating } from '@/components/StarRating';

export default function PackageDetailPage() {
  const { slug } = useParams();
  const { data: session } = useSession();
  const router = useRouter();
  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingForm, setBookingForm] = useState({
    guests_count: 1, contact_email: '', contact_phone: '', guest_names: '',
    special_requests: '', package_date_id: '', promo_code: '',
  });
  const [promoResult, setPromoResult] = useState(null);
  const [bookingStep, setBookingStep] = useState(0); // 0=idle, 1=form, 2=payment, 3=success
  const [bookingRef, setBookingRef] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/packages/${slug}`).then(r => r.json()).then(data => {
      if (data.error) { setLoading(false); return; }
      setPkg(data);
      setLoading(false);
    });
  }, [slug]);

  useEffect(() => {
    if (session?.user?.email) {
      setBookingForm(f => ({ ...f, contact_email: session.user.email }));
    }
  }, [session]);

  async function validatePromo() {
    if (!bookingForm.promo_code) return;
    const res = await fetch('/api/promo-codes/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: bookingForm.promo_code, agent_id: pkg.agent_id }),
    });
    const data = await res.json();
    setPromoResult(data);
  }

  function calcTotal() {
    let total = (pkg?.price_amount || 0) * bookingForm.guests_count;
    if (promoResult?.valid) {
      if (promoResult.discount_type === 'percentage') {
        total -= Math.floor(total * promoResult.discount_value / 100);
      } else {
        total -= promoResult.discount_value;
      }
    }
    return Math.max(0, total);
  }

  async function handleBooking(e) {
    e.preventDefault();
    setError('');
    if (!session) { router.push('/login'); return; }
    if (bookingStep === 1) { setBookingStep(2); return; }

    setSubmitting(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          package_id: pkg.id,
          package_date_id: bookingForm.package_date_id || null,
          guests_count: bookingForm.guests_count,
          guest_names: bookingForm.guest_names,
          contact_email: bookingForm.contact_email,
          contact_phone: bookingForm.contact_phone,
          special_requests: bookingForm.special_requests,
          payment_method: 'card',
          promo_code: promoResult?.valid ? promoResult.code : '',
        }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); setSubmitting(false); return; }
      setBookingRef(data.booking_ref);
      setBookingStep(3);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    }
    setSubmitting(false);
  }

  async function handleContactOperator() {
    if (!session) {
      router.push(`/login?callbackUrl=/packages/${slug}`);
      return;
    }
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_id: pkg.agent_id }),
      });
      const data = await res.json();
      if (data.conversation) {
        router.push(`/dashboard/messages?conversation=${data.conversation.id}`);
      } else {
        router.push('/dashboard/messages');
      }
    } catch (err) {
      router.push('/dashboard/messages');
    }
  }

  if (loading) return <div className="loading-page"><div className="loading-spinner"></div></div>;
  if (!pkg) return <div className="page-content"><div className="container"><div className="empty-state"><h3>Package not found</h3></div></div></div>;

  const inclusions = pkg.inclusions ? pkg.inclusions.split('\n').filter(Boolean) : [];
  const exclusions = pkg.exclusions ? pkg.exclusions.split('\n').filter(Boolean) : [];
  const highlights = pkg.highlights ? pkg.highlights.split('\n').filter(Boolean) : [];

  return (
    <div className="page-content">
      <div className="container">
        {/* Header */}
        <div className="package-detail-header">
          <h1>{pkg.title}</h1>
          <div className="package-meta-bar">
            {pkg.destination && <span>{pkg.destination}{pkg.country ? `, ${pkg.country}` : ''}</span>}
            <span>{pkg.duration_days} day{pkg.duration_days !== 1 ? 's' : ''}{pkg.duration_nights ? `, ${pkg.duration_nights} night${pkg.duration_nights !== 1 ? 's' : ''}` : ''}</span>
            {pkg.difficulty_level && <span>Difficulty: {pkg.difficulty_level}</span>}
            {pkg.review_count > 0 && (
              <span>
                <StarRating value={Math.round(pkg.avg_rating)} readonly /> ({pkg.review_count} review{pkg.review_count !== 1 ? 's' : ''})
              </span>
            )}
          </div>
        </div>

        {/* Images */}
        {pkg.images && pkg.images.length > 0 && (
          <div className="package-gallery">
            <img src={pkg.images[0]?.image_url} alt={pkg.images[0]?.alt_text || pkg.title} onError={(e) => { e.target.src = '/images/placeholder-travel.jpg'; }} />
            {pkg.images.length > 1 && (
              <div className="package-gallery-side">
                {pkg.images.slice(1, 3).map((img, idx) => (
                  <img key={idx} src={img.image_url} alt={img.alt_text || ''} onError={(e) => { e.target.src = '/images/placeholder-travel.jpg'; }} />
                ))}
              </div>
            )}
          </div>
        )}

        <div className="package-layout-grid">
          {/* Left Column */}
          <div>
            {pkg.description && (
              <div className="mb-4">
                <h2>About This Trip</h2>
                <p style={{ whiteSpace: 'pre-wrap', color: 'var(--color-text-secondary)', lineHeight: 1.8 }}>{pkg.description}</p>
              </div>
            )}

            {highlights.length > 0 && (
              <div className="mb-4">
                <h3>Highlights</h3>
                <ul className="inclusion-list">
                  {highlights.map((h, i) => <li key={i}>{h}</li>)}
                </ul>
              </div>
            )}

            {/* Itinerary */}
            {pkg.itinerary && pkg.itinerary.length > 0 && (
              <div className="mb-4">
                <h2>Itinerary</h2>
                <div className="itinerary-list">
                  {pkg.itinerary.map((day) => (
                    <div key={day.id} className="itinerary-day">
                      <div className="itinerary-day-header">
                        <div className="itinerary-day-number">{day.day_number}</div>
                        <h3 className="itinerary-day-title">{day.title}</h3>
                      </div>
                      {day.description && <div className="itinerary-day-content"><p>{day.description}</p></div>}
                      <div className="itinerary-day-details">
                        {day.meals && <span>Meals: {day.meals}</span>}
                        {day.accommodation && <span>Stay: {day.accommodation}</span>}
                        {day.activities && <span>Activities: {day.activities}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(inclusions.length > 0 || exclusions.length > 0) && (
              <div className="mb-4" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                {inclusions.length > 0 && (
                  <div>
                    <h3>Inclusions</h3>
                    <ul className="inclusion-list">{inclusions.map((item, i) => <li key={i}>{item}</li>)}</ul>
                  </div>
                )}
                {exclusions.length > 0 && (
                  <div>
                    <h3>Exclusions</h3>
                    <ul className="exclusion-list">{exclusions.map((item, i) => <li key={i}>{item}</li>)}</ul>
                  </div>
                )}
              </div>
            )}

            {pkg.meeting_point && (
              <div className="mb-4">
                <h3>Meeting Point</h3>
                <p style={{ color: 'var(--color-text-secondary)' }}>{pkg.meeting_point}</p>
              </div>
            )}

            {/* Reviews */}
            <div className="mb-4">
              <h2>Reviews</h2>
              {pkg.reviews && pkg.reviews.length > 0 ? (
                pkg.reviews.map((review) => (
                  <div key={review.id} className="review-card">
                    <div className="review-header">
                      <div>
                        <span className="review-author">{review.user_name}</span>
                        <div><StarRating value={review.rating} readonly /></div>
                      </div>
                      <span className="review-date">{new Date(review.created_at).toLocaleDateString()}</span>
                    </div>
                    {review.comment && <p style={{ color: 'var(--color-text-secondary)', margin: '8px 0 0' }}>{review.comment}</p>}
                  </div>
                ))
              ) : (
                <p style={{ color: 'var(--color-text-light)' }}>No reviews yet.</p>
              )}
            </div>
          </div>

          {/* Right Column - Booking Sidebar */}
          <div className="booking-sidebar">
            <div className="booking-card">
              {bookingStep === 3 ? (
                <div className="text-center">
                  <h3 style={{ color: 'var(--color-success)', marginBottom: '12px' }}>Booking Confirmed!</h3>
                  <p>Your reference: <strong>{bookingRef}</strong></p>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                    A confirmation email has been sent to your email address. Your travel agent will review your booking shortly.
                  </p>
                  <button className="btn btn-primary btn-block mt-2" onClick={() => router.push('/dashboard/bookings')}>View My Bookings</button>
                </div>
              ) : (
                <>
                  <div className="price-display">
                    ${(pkg.price_amount / 100).toFixed(0)} <span>/ {pkg.price_per || 'person'}</span>
                  </div>

                  {bookingStep === 0 && (
                    <button
                      className="btn btn-primary btn-block btn-lg"
                      onClick={() => { if (!session) { router.push('/login'); } else { setBookingStep(1); } }}
                    >
                      Book Now
                    </button>
                  )}

                  {(bookingStep === 1 || bookingStep === 2) && (
                    <form onSubmit={handleBooking}>
                      {error && <div className="alert alert-danger">{error}</div>}

                      {bookingStep === 1 && (
                        <>
                          {pkg.dates && pkg.dates.length > 0 && (
                            <div className="form-group">
                              <label className="form-label">Select Date</label>
                              <select className="form-select" value={bookingForm.package_date_id} onChange={(e) => setBookingForm({ ...bookingForm, package_date_id: e.target.value })}>
                                <option value="">Choose a date</option>
                                {pkg.dates.map(d => (
                                  <option key={d.id} value={d.id} disabled={d.available_slots - d.booked_slots <= 0}>
                                    {new Date(d.start_date).toLocaleDateString()}{d.end_date ? ` - ${new Date(d.end_date).toLocaleDateString()}` : ''} ({d.available_slots - d.booked_slots} slots left)
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                          <div className="form-group">
                            <label className="form-label">Number of Guests</label>
                            <input type="number" className="form-input" min="1" max={pkg.max_guests} value={bookingForm.guests_count} onChange={(e) => setBookingForm({ ...bookingForm, guests_count: parseInt(e.target.value) || 1 })} />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Contact Email</label>
                            <input type="email" className="form-input" required value={bookingForm.contact_email} onChange={(e) => setBookingForm({ ...bookingForm, contact_email: e.target.value })} />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Contact Phone</label>
                            <input type="tel" className="form-input" value={bookingForm.contact_phone} onChange={(e) => setBookingForm({ ...bookingForm, contact_phone: e.target.value })} />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Guest Names</label>
                            <textarea className="form-textarea" placeholder="Enter guest names, one per line" value={bookingForm.guest_names} onChange={(e) => setBookingForm({ ...bookingForm, guest_names: e.target.value })} style={{ minHeight: '80px' }} />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Special Requests</label>
                            <textarea className="form-textarea" placeholder="Any dietary needs, accessibility requirements, etc." value={bookingForm.special_requests} onChange={(e) => setBookingForm({ ...bookingForm, special_requests: e.target.value })} style={{ minHeight: '60px' }} />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Promo Code</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <input type="text" className="form-input" placeholder="Enter code" value={bookingForm.promo_code} onChange={(e) => setBookingForm({ ...bookingForm, promo_code: e.target.value })} />
                              <button type="button" className="btn btn-secondary btn-sm" onClick={validatePromo}>Apply</button>
                            </div>
                            {promoResult && (
                              <span className="form-hint" style={{ color: promoResult.valid ? 'var(--color-success)' : 'var(--color-danger)' }}>
                                {promoResult.valid ? `${promoResult.discount_type === 'percentage' ? promoResult.discount_value + '%' : '$' + (promoResult.discount_value / 100).toFixed(2)} discount applied` : promoResult.error || 'Invalid code'}
                              </span>
                            )}
                          </div>
                        </>
                      )}

                      {bookingStep === 2 && (
                        <>
                          <h4 style={{ marginBottom: '16px' }}>Payment Details</h4>
                          <div className="form-group">
                            <label className="form-label">Card Number</label>
                            <input type="text" className="form-input" placeholder="4242 4242 4242 4242" maxLength={19} required />
                          </div>
                          <div className="form-row">
                            <div className="form-group">
                              <label className="form-label">Expiry</label>
                              <input type="text" className="form-input" placeholder="MM/YY" maxLength={5} required />
                            </div>
                            <div className="form-group">
                              <label className="form-label">CVC</label>
                              <input type="text" className="form-input" placeholder="123" maxLength={4} required />
                            </div>
                          </div>
                          <div className="form-group">
                            <label className="form-label">Name on Card</label>
                            <input type="text" className="form-input" required />
                          </div>
                        </>
                      )}

                      <hr className="divider" />
                      <div className="flex-between mb-2">
                        <span>Subtotal ({bookingForm.guests_count} guest{bookingForm.guests_count > 1 ? 's' : ''})</span>
                        <span>${((pkg.price_amount * bookingForm.guests_count) / 100).toFixed(2)}</span>
                      </div>
                      {promoResult?.valid && (
                        <div className="flex-between mb-2" style={{ color: 'var(--color-success)' }}>
                          <span>Discount</span>
                          <span>-${(((pkg.price_amount * bookingForm.guests_count) - calcTotal()) / 100).toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex-between mb-3" style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                        <span>Total</span>
                        <span>${(calcTotal() / 100).toFixed(2)}</span>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setBookingStep(bookingStep - 1)}>Back</button>
                        <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={submitting}>
                          {submitting ? 'Processing...' : bookingStep === 1 ? 'Continue to Payment' : 'Confirm Booking'}
                        </button>
                      </div>
                    </form>
                  )}

                  {pkg.cancellation_days > 0 && bookingStep === 0 && (
                    <p style={{ marginTop: '12px', fontSize: '0.85rem', color: 'var(--color-text-light)', textAlign: 'center' }}>
                      Free cancellation up to {pkg.cancellation_days} days before departure
                    </p>
                  )}

                  {pkg.agent_name && bookingStep === 0 && (
                    <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
                      <p style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', marginBottom: '4px' }}>Hosted by</p>
                      <p style={{ fontWeight: 600, marginBottom: '10px' }}>{pkg.agent_company || pkg.agent_name}</p>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ width: '100%' }}
                        onClick={handleContactOperator}
                      >
                        Message Tour Operator
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
