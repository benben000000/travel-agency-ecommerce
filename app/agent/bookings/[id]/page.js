'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AgentBookingDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
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

  async function updateStatus(newStatus) {
    setUpdating(true);
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else fetchBooking();
    } catch (err) {
      setError('Failed to update booking status.');
    }
    setUpdating(false);
  }

  async function startConversation() {
    if (!booking) return;
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: booking.user_id,
          booking_id: booking.id,
        }),
      });
      const data = await res.json();
      if (data.conversation) {
        router.push(`/agent/messages?conversation=${data.conversation.id}`);
      }
    } catch (err) {
      router.push('/agent/messages');
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
        <Link href="/agent/bookings" className="btn btn-secondary btn-sm">
          Back to Bookings
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="dashboard-header">
        <div>
          <Link href="/agent/bookings" style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
            &larr; Back to Client Bookings
          </Link>
          <h1 style={{ marginTop: '8px' }}>Booking #{booking.booking_ref}</h1>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={startConversation} className="btn btn-primary btn-sm">
            Chat with Customer
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Customer Information */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '16px' }}>Customer Information</h3>
          <table width="100%" style={{ fontSize: '0.9rem', borderCollapse: 'collapse', marginBottom: '20px' }}>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '8px 0', color: 'var(--color-text-secondary)' }}>Name</td>
                <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: '600' }}>{booking.user_name}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '8px 0', color: 'var(--color-text-secondary)' }}>Email</td>
                <td style={{ padding: '8px 0', textAlign: 'right' }}>{booking.contact_email}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '8px 0', color: 'var(--color-text-secondary)' }}>Phone</td>
                <td style={{ padding: '8px 0', textAlign: 'right' }}>{booking.contact_phone || 'Not provided'}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '8px 0', color: 'var(--color-text-secondary)' }}>Guest Count</td>
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

          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
            <h4 style={{ marginBottom: '12px' }}>Update Status</h4>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => updateStatus('confirmed')}
                disabled={updating || booking.status === 'confirmed'}
              >
                Confirm Booking
              </button>
              <button
                type="button"
                className="btn btn-sm"
                style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
                onClick={() => updateStatus('completed')}
                disabled={updating || booking.status === 'completed'}
              >
                Mark Completed
              </button>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={() => updateStatus('rejected')}
                disabled={updating || booking.status === 'rejected'}
              >
                Reject
              </button>
            </div>
          </div>
        </div>

        {/* Package & Payment Information */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '16px' }}>Package & Billing Details</h3>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '1.05rem', color: 'var(--color-primary)' }}>
              <Link href={`/packages/${booking.package_slug}`}>{booking.package_title}</Link>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
              Destination: {booking.package_destination || booking.destination || 'Global'}
            </div>
          </div>

          <table width="100%" style={{ fontSize: '0.9rem', borderCollapse: 'collapse', marginBottom: '20px' }}>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '8px 0', color: 'var(--color-text-secondary)' }}>Travel Date</td>
                <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: '600' }}>
                  {booking.start_date ? `${booking.start_date} ${booking.end_date ? 'to ' + booking.end_date : ''}` : 'Flexible'}
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '8px 0', color: 'var(--color-text-secondary)' }}>Status</td>
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
              {booking.discount_amount > 0 && (
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '8px 0', color: 'var(--color-text-secondary)' }}>Promo Discount</td>
                  <td style={{ padding: '8px 0', textAlign: 'right', color: 'var(--color-success)' }}>
                    -${(booking.discount_amount / 100).toFixed(2)}
                  </td>
                </tr>
              )}
              <tr>
                <td style={{ padding: '12px 0 0', fontWeight: 'bold', fontSize: '1rem' }}>Total Paid</td>
                <td style={{ padding: '12px 0 0', textAlign: 'right', fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--color-primary)' }}>
                  ${(booking.total_amount / 100).toFixed(2)} {booking.currency}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
