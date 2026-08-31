'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function BookingDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancel, setShowCancel] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBooking();
  }, [id]);

  async function fetchBooking() {
    try {
      const res = await fetch(`/api/bookings/${id}`);
      const data = await res.json();
      const bookingData = data.booking || (data.id ? data : null);
      if (bookingData) {
        setBooking(bookingData);
      } else if (data.error) {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to load booking details.');
    }
    setLoading(false);
  }

  async function handleCancel() {
    setCancelling(true);
    setError('');
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'cancelled',
          cancellation_reason: cancelReason || 'Cancelled by traveler',
        }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setShowCancel(false);
        fetchBooking();
      }
    } catch (err) {
      setError('Failed to cancel booking.');
    }
    setCancelling(false);
  }

  async function startConversation() {
    if (!booking) return;
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: booking.agent_id,
          booking_id: booking.id,
        }),
      });
      const data = await res.json();
      if (data.conversation) {
        router.push(`/dashboard/messages?conversation=${data.conversation.id}`);
      }
    } catch (err) {
      router.push('/dashboard/messages');
    }
  }

  function getStatusClass(status) {
    switch (status) {
      case 'confirmed': return 'status-label status-confirmed';
      case 'pending': return 'status-label status-pending';
      case 'cancelled': return 'status-label status-cancelled';
      case 'completed': return 'status-label status-completed';
      default: return 'status-label';
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
        <h3>Error</h3>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '16px' }}>{error || 'Booking not found.'}</p>
        <Link href="/dashboard/bookings" className="btn btn-secondary btn-sm">
          Back to Bookings
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="dashboard-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <Link href="/dashboard/bookings" style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
              &larr; Back to My Bookings
            </Link>
          </div>
          <h1>Booking #{booking.booking_ref}</h1>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={startConversation} className="btn btn-primary btn-sm">
            Message Agent
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '16px' }}>Package Details</h3>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
              <Link href={`/packages/${booking.package_slug}`}>{booking.package_title}</Link>
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              Destination: {booking.package_destination || 'Global'}
            </div>
          </div>

          <table width="100%" style={{ fontSize: '0.9rem', borderCollapse: 'collapse' }}>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '8px 0', color: 'var(--color-text-secondary)' }}>Travel Date</td>
                <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: '600' }}>
                  {booking.start_date ? `${booking.start_date} ${booking.end_date ? 'to ' + booking.end_date : ''}` : 'Flexible'}
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '8px 0', color: 'var(--color-text-secondary)' }}>Duration</td>
                <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: '600' }}>
                  {booking.duration_days} Day(s) {booking.duration_nights ? `/ ${booking.duration_nights} Night(s)` : ''}
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '8px 0', color: 'var(--color-text-secondary)' }}>Guests</td>
                <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: '600' }}>{booking.guests_count}</td>
              </tr>
              {booking.guest_names && (
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '8px 0', color: 'var(--color-text-secondary)' }}>Guest Names</td>
                  <td style={{ padding: '8px 0', textAlign: 'right' }}>{booking.guest_names}</td>
                </tr>
              )}
              {booking.special_requests && (
                <tr>
                  <td style={{ padding: '8px 0', color: 'var(--color-text-secondary)' }}>Special Requests</td>
                  <td style={{ padding: '8px 0', textAlign: 'right' }}>{booking.special_requests}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '16px' }}>Payment & Status</h3>
          <table width="100%" style={{ fontSize: '0.9rem', borderCollapse: 'collapse', marginBottom: '20px' }}>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '8px 0', color: 'var(--color-text-secondary)' }}>Booking Status</td>
                <td style={{ padding: '8px 0', textAlign: 'right' }}>
                  <span className={getStatusClass(booking.status)}>{booking.status}</span>
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '8px 0', color: 'var(--color-text-secondary)' }}>Payment Status</td>
                <td style={{ padding: '8px 0', textAlign: 'right' }}>
                  <span className={getStatusClass(booking.payment_status)}>{booking.payment_status}</span>
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '8px 0', color: 'var(--color-text-secondary)' }}>Payment Method</td>
                <td style={{ padding: '8px 0', textAlign: 'right', textTransform: 'uppercase' }}>
                  {booking.payment_method || 'Credit Card'}
                </td>
              </tr>
              {booking.discount_amount > 0 && (
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '8px 0', color: 'var(--color-text-secondary)' }}>Discount Applied</td>
                  <td style={{ padding: '8px 0', textAlign: 'right', color: 'var(--color-success)' }}>
                    -${(booking.discount_amount / 100).toFixed(2)}
                  </td>
                </tr>
              )}
              <tr>
                <td style={{ padding: '12px 0 0', fontWeight: 'bold', fontSize: '1rem', color: 'var(--color-primary)' }}>
                  Total Amount
                </td>
                <td style={{ padding: '12px 0 0', textAlign: 'right', fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--color-primary)' }}>
                  ${(booking.total_amount / 100).toFixed(2)} {booking.currency}
                </td>
              </tr>
            </tbody>
          </table>

          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
            <div style={{ fontWeight: '600', marginBottom: '8px' }}>Tour Operator</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--color-text)' }}>{booking.agent_name}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{booking.agent_email}</div>
          </div>

          {(booking.status === 'pending' || booking.status === 'confirmed') && (
            <div style={{ marginTop: '24px' }}>
              {!showCancel ? (
                <button
                  type="button"
                  className="btn btn-sm"
                  style={{ width: '100%', color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                  onClick={() => setShowCancel(true)}
                >
                  Cancel Booking
                </button>
              ) : (
                <div style={{ background: 'var(--color-bg-alt)', padding: '16px', borderRadius: 'var(--radius)' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '8px' }}>
                    Confirm Cancellation
                  </div>
                  <textarea
                    rows={2}
                    className="form-textarea"
                    placeholder="Reason (optional)"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    style={{ marginBottom: '12px' }}
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={handleCancel}
                      disabled={cancelling}
                    >
                      {cancelling ? 'Cancelling...' : 'Confirm'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setShowCancel(false)}
                    >
                      Keep
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
