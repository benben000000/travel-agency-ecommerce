'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { StarRating } from '@/components/StarRating';

const PAGE_SIZE = 10;

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  
  // Review Modal State
  const [reviewModal, setReviewModal] = useState({ open: false, booking: null, rating: 5, comment: '', submitting: false, error: '' });

  // Cancel Modal State
  const [cancelModal, setCancelModal] = useState({ open: false, booking: null, reason: '', submitting: false, error: '' });

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
    fetchBookings();
  }, [statusFilter]);

  async function fetchBookings() {
    setLoading(true);
    try {
      const url = statusFilter ? `/api/bookings?status=${statusFilter}` : '/api/bookings';
      const res = await fetch(url);
      const data = await res.json();
      if (data.bookings) setBookings(data.bookings);
    } catch (err) {}
    setLoading(false);
  }

  async function handleCancelBooking(e) {
    e.preventDefault();
    if (!cancelModal.booking) return;
    setCancelModal((m) => ({ ...m, submitting: true, error: '' }));

    try {
      const res = await fetch(`/api/bookings/${cancelModal.booking.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'cancelled',
          cancellation_reason: cancelModal.reason || 'Cancelled by traveler',
        }),
      });
      const data = await res.json();
      if (data.error) {
        setCancelModal((m) => ({ ...m, submitting: false, error: data.error }));
      } else {
        setCancelModal({ open: false, booking: null, reason: '', submitting: false, error: '' });
        fetchBookings();
      }
    } catch (err) {
      setCancelModal((m) => ({ ...m, submitting: false, error: 'Failed to cancel booking.' }));
    }
  }

  async function handleSubmitReview(e) {
    e.preventDefault();
    if (!reviewModal.booking) return;
    setReviewModal((m) => ({ ...m, submitting: true, error: '' }));

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          package_id: reviewModal.booking.package_id,
          booking_id: reviewModal.booking.id,
          rating: reviewModal.rating,
          comment: reviewModal.comment,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setReviewModal((m) => ({ ...m, submitting: false, error: data.error }));
      } else {
        setReviewModal({ open: false, booking: null, rating: 5, comment: '', submitting: false, error: '' });
        fetchBookings();
      }
    } catch (err) {
      setReviewModal((m) => ({ ...m, submitting: false, error: 'Failed to submit review.' }));
    }
  }

  function getStatusClass(status) {
    switch (status) {
      case 'confirmed': return 'status-label status-confirmed';
      case 'pending': return 'status-label status-pending';
      case 'cancelled': return 'status-label status-cancelled';
      case 'completed': return 'status-label status-completed';
      case 'rejected': return 'status-label status-rejected';
      default: return 'status-label';
    }
  }

  const visibleBookings = bookings.slice(0, visibleCount);
  const hasMore = visibleCount < bookings.length;

  return (
    <div>
      <div className="dashboard-header">
        <div>
          <h1>My Bookings</h1>
          <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
            View, track, and manage all your booked tours and travel bundles.
          </p>
        </div>
        <Link href="/packages" className="btn btn-primary btn-sm">
          Book New Package
        </Link>
      </div>

      <div className="filters-bar" style={{ marginBottom: '20px' }}>
        <button
          className={`btn btn-sm ${statusFilter === '' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setStatusFilter('')}
        >
          All ({bookings.length})
        </button>
        <button
          className={`btn btn-sm ${statusFilter === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setStatusFilter('pending')}
        >
          Pending
        </button>
        <button
          className={`btn btn-sm ${statusFilter === 'confirmed' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setStatusFilter('confirmed')}
        >
          Confirmed
        </button>
        <button
          className={`btn btn-sm ${statusFilter === 'completed' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setStatusFilter('completed')}
        >
          Completed
        </button>
        <button
          className={`btn btn-sm ${statusFilter === 'cancelled' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setStatusFilter('cancelled')}
        >
          Cancelled
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="loading-spinner"></div>
        </div>
      ) : bookings.length === 0 ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <h3>No Bookings Found</h3>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
            {statusFilter
              ? `No bookings match the status '${statusFilter}'.`
              : 'You have not booked any travel packages yet.'}
          </p>
          <Link href="/packages" className="btn btn-primary btn-sm">
            Browse Packages
          </Link>
        </div>
      ) : (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div className="table-container" style={{ margin: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Booking Ref</th>
                  <th>Package</th>
                  <th>Dates / Guests</th>
                  <th>Total Paid</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleBookings.map((b) => (
                  <tr key={b.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{b.booking_ref}</td>
                    <td>
                      <div style={{ fontWeight: '600' }}>{b.package_title}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                        Tour Agent: {b.agent_name}
                      </div>
                    </td>
                    <td>
                      <div>{b.start_date || 'Flexible Date'}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                        {b.guests_count} guest{b.guests_count > 1 ? 's' : ''}
                      </div>
                    </td>
                    <td style={{ fontWeight: '600' }}>
                      ${(b.total_amount / 100).toFixed(2)} {b.currency}
                    </td>
                    <td>
                      <span className={getStatusClass(b.status)}>{b.status}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <Link href={`/dashboard/bookings/${b.id}`} className="btn btn-secondary btn-sm">
                          Details
                        </Link>
                        {(b.status === 'pending' || b.status === 'confirmed') && (
                          <button
                            type="button"
                            className="btn btn-sm"
                            style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                            onClick={() => setCancelModal({ open: true, booking: b, reason: '', submitting: false, error: '' })}
                          >
                            Cancel
                          </button>
                        )}
                        {b.status === 'completed' && (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => setReviewModal({ open: true, booking: b, rating: 5, comment: '', submitting: false, error: '' })}
                          >
                            Review
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {hasMore && (
            <div style={{ textAlign: 'center', padding: '20px', borderTop: '1px solid var(--color-border)', background: 'var(--color-bg-card)' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
              >
                Load More Bookings ({visibleBookings.length} of {bookings.length})
              </button>
            </div>
          )}
        </div>
      )}

      {/* Cancel Modal */}
      {cancelModal.open && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Cancel Booking ({cancelModal.booking?.booking_ref})</h3>
              <button
                className="modal-close"
                onClick={() => setCancelModal({ open: false, booking: null, reason: '', submitting: false, error: '' })}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleCancelBooking}>
              <div className="modal-body">
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
                  Are you sure you want to cancel your reservation for <strong>{cancelModal.booking?.package_title}</strong>?
                </p>
                {cancelModal.error && <div className="alert alert-danger">{cancelModal.error}</div>}
                <div className="form-group">
                  <label className="form-label">Reason for Cancellation (Optional)</label>
                  <textarea
                    className="form-textarea"
                    rows="3"
                    value={cancelModal.reason}
                    onChange={(e) => setCancelModal((m) => ({ ...m, reason: e.target.value }))}
                    placeholder="Let us know why you need to cancel..."
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setCancelModal({ open: false, booking: null, reason: '', submitting: false, error: '' })}
                >
                  Keep Booking
                </button>
                <button type="submit" className="btn btn-danger btn-sm" disabled={cancelModal.submitting}>
                  {cancelModal.submitting ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewModal.open && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Review Trip ({reviewModal.booking?.package_title})</h3>
              <button
                className="modal-close"
                onClick={() => setReviewModal({ open: false, booking: null, rating: 5, comment: '', submitting: false, error: '' })}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmitReview}>
              <div className="modal-body">
                {reviewModal.error && <div className="alert alert-danger">{reviewModal.error}</div>}
                <div className="form-group">
                  <label className="form-label">Your Rating</label>
                  <StarRating
                    value={reviewModal.rating}
                    onChange={(val) => setReviewModal((m) => ({ ...m, rating: val }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Review Comments</label>
                  <textarea
                    className="form-textarea"
                    required
                    rows="4"
                    value={reviewModal.comment}
                    onChange={(e) => setReviewModal((m) => ({ ...m, comment: e.target.value }))}
                    placeholder="Share your travel experience, guide feedback, and highlights..."
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setReviewModal({ open: false, booking: null, rating: 5, comment: '', submitting: false, error: '' })}
                >
                  Close
                </button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={reviewModal.submitting}>
                  {reviewModal.submitting ? 'Submitting...' : 'Post Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
