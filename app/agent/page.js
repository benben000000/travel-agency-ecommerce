'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function AgentOverviewPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      const [statsRes, bookingsRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/bookings'),
      ]);
      const statsData = await statsRes.json();
      const bookingsData = await bookingsRes.json();

      if (statsData.stats) setStats(statsData.stats);
      if (bookingsData.bookings) setRecentBookings(bookingsData.bookings.slice(0, 5));
    } catch (err) {}
    setLoading(false);
  }

  async function updateBookingStatus(bookingId, newStatus) {
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!data.error) {
        fetchDashboardData();
      }
    } catch (err) {}
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

  return (
    <div>
      <div className="dashboard-header">
        <div>
          <h1>Operator Dashboard</h1>
          <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
            Overview of your travel listings, client bookings, and revenue metrics.
          </p>
        </div>
        <Link href="/agent/packages/new" className="btn btn-primary btn-sm">
          + Create New Listing
        </Link>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Listings</div>
          <div className="stat-value">{stats?.totalPackages ?? 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Listings</div>
          <div className="stat-value">{stats?.activePackages ?? 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pending Bookings</div>
          <div className="stat-value" style={{ color: stats?.pendingBookings > 0 ? 'var(--color-warning)' : 'inherit' }}>
            {stats?.pendingBookings ?? 0}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Bookings</div>
          <div className="stat-value">{stats?.totalBookings ?? 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Revenue</div>
          <div className="stat-value">
            ${((stats?.totalRevenue ?? 0) / 100).toFixed(2)}
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '24px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0 }}>Recent Client Bookings</h3>
          <Link href="/agent/bookings" style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
            View All
          </Link>
        </div>

        {recentBookings.length === 0 ? (
          <div className="empty-state" style={{ padding: '32px 0' }}>
            <p>No bookings received yet for your travel packages.</p>
          </div>
        ) : (
          <div className="table-container" style={{ margin: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ref #</th>
                  <th>Customer</th>
                  <th>Package</th>
                  <th>Guests</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((b) => (
                  <tr key={b.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{b.booking_ref}</td>
                    <td>
                      <div style={{ fontWeight: '600' }}>{b.user_name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{b.contact_email}</div>
                    </td>
                    <td>{b.package_title}</td>
                    <td>{b.guests_count}</td>
                    <td style={{ fontWeight: '600' }}>
                      ${(b.total_amount / 100).toFixed(2)} {b.currency}
                    </td>
                    <td>
                      <span className={getStatusClass(b.status)}>{b.status}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {b.status === 'pending' && (
                          <>
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              onClick={() => updateBookingStatus(b.id, 'confirmed')}
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() => updateBookingStatus(b.id, 'rejected')}
                            >
                              Reject
                            </button>
                          </>
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
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        <div className="card" style={{ padding: '24px' }}>
          <h4 style={{ marginBottom: '12px' }}>Manage Listings</h4>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
            Add new tours, adjust pricing, update itinerary days, or configure departure dates.
          </p>
          <Link href="/agent/packages" className="btn btn-secondary btn-sm">
            Manage Packages
          </Link>
        </div>

        <div className="card" style={{ padding: '24px' }}>
          <h4 style={{ marginBottom: '12px' }}>Discount Promo Codes</h4>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
            Create coupon codes to promote seasonal bundles and increase customer bookings.
          </p>
          <Link href="/agent/promo-codes" className="btn btn-secondary btn-sm">
            Manage Codes
          </Link>
        </div>

        <div className="card" style={{ padding: '24px' }}>
          <h4 style={{ marginBottom: '12px' }}>Traveler Inquiries</h4>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
            Respond to client messages regarding special accommodations, dates, and package details.
          </p>
          <Link href="/agent/messages" className="btn btn-secondary btn-sm">
            Open Chat
          </Link>
        </div>
      </div>
    </div>
  );
}
