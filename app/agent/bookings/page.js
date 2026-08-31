'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const PAGE_SIZE = 10;

export default function AgentBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

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

  async function updateStatus(bookingId, newStatus) {
    setUpdatingId(bookingId);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!data.error) {
        fetchBookings();
      }
    } catch (err) {}
    setUpdatingId(null);
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
          <h1>Client Bookings</h1>
          <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
            Manage traveler reservations, confirm bookings, and coordinate customer journeys.
          </p>
        </div>
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
          <p style={{ color: 'var(--color-text-secondary)' }}>
            {statusFilter
              ? `No bookings match status '${statusFilter}'.`
              : 'You have not received any client bookings yet.'}
          </p>
        </div>
      ) : (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div className="table-container" style={{ margin: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Booking Ref</th>
                  <th>Traveler</th>
                  <th>Package</th>
                  <th>Travel Dates</th>
                  <th>Guests</th>
                  <th>Total Price</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleBookings.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                        {b.booking_ref}
                      </span>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>
                        {new Date(b.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: '600' }}>{b.user_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                        {b.contact_email || b.user_email}
                      </div>
                    </td>
                    <td>
                      <Link href={`/packages/${b.package_slug}`} style={{ fontWeight: '600' }}>
                        {b.package_title}
                      </Link>
                    </td>
                    <td>
                      {b.start_date ? (
                        <span style={{ fontSize: '0.85rem' }}>
                          {b.start_date} &rarr; {b.end_date}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--color-text-light)', fontSize: '0.85rem' }}>Flexible</span>
                      )}
                    </td>
                    <td>{b.guests_count}</td>
                    <td style={{ fontWeight: 'bold' }}>
                      ${(b.total_amount / 100).toFixed(2)}
                    </td>
                    <td>
                      <span className={getStatusClass(b.status)}>{b.status}</span>
                    </td>
                    <td>
                      <span className={b.payment_status === 'paid' ? 'status-label status-confirmed' : 'status-label status-pending'}>
                        {b.payment_status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <Link href={`/agent/bookings/${b.id}`} className="btn btn-secondary btn-sm">
                          Details
                        </Link>
                        {b.status === 'pending' && (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            disabled={updatingId === b.id}
                            onClick={() => updateStatus(b.id, 'confirmed')}
                          >
                            Confirm
                          </button>
                        )}
                        {b.status === 'confirmed' && (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            disabled={updatingId === b.id}
                            onClick={() => updateStatus(b.id, 'completed')}
                          >
                            Complete
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
    </div>
  );
}
