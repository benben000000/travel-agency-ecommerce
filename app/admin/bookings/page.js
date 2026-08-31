'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
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
      if (!data.error) fetchBookings();
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

  return (
    <div>
      <div className="dashboard-header">
        <div>
          <h1>All Platform Bookings</h1>
          <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
            Master ledger of all client reservations, payments, and tour operator transactions.
          </p>
        </div>
      </div>

      <div className="filters-bar" style={{ marginBottom: '20px' }}>
        <button
          className={`btn btn-sm ${statusFilter === '' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setStatusFilter('')}
        >
          All
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
              : 'No reservations have been placed on the marketplace yet.'}
          </p>
        </div>
      ) : (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div className="table-container" style={{ margin: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ref #</th>
                  <th>Customer</th>
                  <th>Package</th>
                  <th>Tour Agent</th>
                  <th>Date / Guests</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{b.booking_ref}</td>
                    <td>
                      <div style={{ fontWeight: '600' }}>{b.user_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>
                        {b.contact_email}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: '600' }}>{b.package_title}</div>
                    </td>
                    <td>{b.agent_name}</td>
                    <td>
                      <div>{b.start_date || 'Flexible'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>
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
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {b.status === 'pending' && (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => updateStatus(b.id, 'confirmed')}
                            disabled={updatingId === b.id}
                          >
                            Confirm
                          </button>
                        )}
                        {b.status === 'confirmed' && (
                          <button
                            type="button"
                            className="btn btn-sm"
                            style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
                            onClick={() => updateStatus(b.id, 'completed')}
                            disabled={updatingId === b.id}
                          >
                            Complete
                          </button>
                        )}
                        {b.status !== 'cancelled' && (
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => updateStatus(b.id, 'cancelled')}
                            disabled={updatingId === b.id}
                          >
                            Cancel
                          </button>
                        )}
                        <Link href={`/agent/bookings/${b.id}`} className="btn btn-secondary btn-sm">
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
