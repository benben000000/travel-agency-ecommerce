'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function UserDashboardOverview() {
  const { data: session } = useSession();
  const [stats, setStats] = useState({ totalBookings: 0, activeBookings: 0, completedBookings: 0 });
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  async function fetchBookings() {
    try {
      const res = await fetch('/api/bookings');
      const data = await res.json();
      if (data.bookings) {
        const bookings = data.bookings;
        setRecentBookings(bookings.slice(0, 5));
        const active = bookings.filter((b) => b.status === 'confirmed' || b.status === 'pending').length;
        const completed = bookings.filter((b) => b.status === 'completed').length;
        setStats({
          totalBookings: bookings.length,
          activeBookings: active,
          completedBookings: completed,
        });
      }
    } catch (err) {}
    setLoading(false);
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
          <h1>Welcome, {session?.user?.name}</h1>
          <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
            Manage your travel bookings and communicate directly with tour operators.
          </p>
        </div>
        <Link href="/packages" className="btn btn-primary btn-sm">
          Book a Trip
        </Link>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Bookings</div>
          <div className="stat-value">{stats.totalBookings}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active / Upcoming</div>
          <div className="stat-value">{stats.activeBookings}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Completed Journeys</div>
          <div className="stat-value">{stats.completedBookings}</div>
        </div>
      </div>

      <div className="card" style={{ padding: '24px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0 }}>Recent Bookings</h3>
          <Link href="/dashboard/bookings" style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
            View All
          </Link>
        </div>

        {recentBookings.length === 0 ? (
          <div className="empty-state" style={{ padding: '32px 0' }}>
            <p>You have not made any bookings yet.</p>
            <Link href="/packages" className="btn btn-secondary btn-sm" style={{ marginTop: '12px' }}>
              Explore Packages
            </Link>
          </div>
        ) : (
          <div className="table-container" style={{ margin: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ref #</th>
                  <th>Package</th>
                  <th>Guests</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((b) => (
                  <tr key={b.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{b.booking_ref}</td>
                    <td>
                      <div style={{ fontWeight: '600' }}>{b.package_title}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                        Agent: {b.agent_name}
                      </div>
                    </td>
                    <td>{b.guests_count}</td>
                    <td style={{ fontWeight: '600' }}>
                      ${(b.total_amount / 100).toFixed(2)} {b.currency}
                    </td>
                    <td>
                      <span className={getStatusClass(b.status)}>{b.status}</span>
                    </td>
                    <td>
                      <Link href={`/dashboard/bookings/${b.id}`} className="btn btn-secondary btn-sm">
                        Details
                      </Link>
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
          <h4 style={{ marginBottom: '12px' }}>Direct Messaging</h4>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
            Have questions about your itinerary or special arrangements? Chat with your assigned tour agent in real time.
          </p>
          <Link href="/dashboard/messages" className="btn btn-secondary btn-sm">
            Open Chat
          </Link>
        </div>

        <div className="card" style={{ padding: '24px' }}>
          <h4 style={{ marginBottom: '12px' }}>Account Settings</h4>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
            Keep your contact information and traveler details updated for seamless booking confirmations.
          </p>
          <Link href="/dashboard/profile" className="btn btn-secondary btn-sm">
            Edit Profile
          </Link>
        </div>
      </div>
    </div>
  );
}
