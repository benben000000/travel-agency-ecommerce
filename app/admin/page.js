'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminOverviewPage() {
  const [stats, setStats] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  async function fetchAdminData() {
    try {
      const [statsRes, bookingsRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/bookings?limit=10'),
      ]);
      const statsData = await statsRes.json();
      const bookingsData = await bookingsRes.json();

      if (statsData.stats) setStats(statsData.stats);
      if (bookingsData.bookings) setRecentBookings(bookingsData.bookings.slice(0, 6));
    } catch (err) {}
    setLoading(false);
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

  return (
    <div>
      <div className="dashboard-header">
        <div>
          <h1>Super Admin Overview</h1>
          <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
            Platform ecosystem metrics, multi-vendor management, and marketplace operations.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link href="/admin/agents/new" className="btn btn-primary btn-sm">
            + New Agent Account
          </Link>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Platform Gross Revenue</div>
          <div className="stat-value">
            ${((stats?.totalRevenue ?? 0) / 100).toFixed(2)}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Bookings</div>
          <div className="stat-value">{stats?.totalBookings ?? 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Listings</div>
          <div className="stat-value">{stats?.totalPackages ?? 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Agents</div>
          <div className="stat-value">{stats?.totalAgents ?? 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Registered Travelers</div>
          <div className="stat-value">{stats?.totalUsers ?? 0}</div>
        </div>
      </div>

      <div className="card" style={{ padding: '24px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0 }}>Recent Marketplace Bookings</h3>
          <Link href="/admin/bookings" style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
            View All
          </Link>
        </div>

        {recentBookings.length === 0 ? (
          <div className="empty-state" style={{ padding: '32px 0' }}>
            <p>No bookings across the marketplace yet.</p>
          </div>
        ) : (
          <div className="table-container" style={{ margin: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Booking Ref</th>
                  <th>Customer</th>
                  <th>Tour Package</th>
                  <th>Agent</th>
                  <th>Amount</th>
                  <th>Status</th>
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
                    <td>{b.agent_name}</td>
                    <td style={{ fontWeight: '600' }}>
                      ${(b.total_amount / 100).toFixed(2)} {b.currency}
                    </td>
                    <td>
                      <span className={getStatusClass(b.status)}>{b.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
        <div className="card" style={{ padding: '24px' }}>
          <h4 style={{ marginBottom: '8px' }}>Agents & Vendors</h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
            Create and onboard tour operators, manage company profiles, and verify vendors.
          </p>
          <Link href="/admin/agents" className="btn btn-secondary btn-sm">
            Manage Agents
          </Link>
        </div>

        <div className="card" style={{ padding: '24px' }}>
          <h4 style={{ marginBottom: '8px' }}>Marketplace Listings</h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
            Review, feature, archive, or moderate listings published across all tour vendors.
          </p>
          <Link href="/admin/packages" className="btn btn-secondary btn-sm">
            Manage Listings
          </Link>
        </div>

        <div className="card" style={{ padding: '24px' }}>
          <h4 style={{ marginBottom: '8px' }}>Destinations & Categories</h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
            Organize marketplace filters with custom destination regions and activity genres.
          </p>
          <Link href="/admin/categories" className="btn btn-secondary btn-sm">
            Manage Categories
          </Link>
        </div>

        <div className="card" style={{ padding: '24px' }}>
          <h4 style={{ marginBottom: '8px' }}>Platform Settings</h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
            Configure site metadata, email SMTP credentials, and platform-wide parameters.
          </p>
          <Link href="/admin/settings" className="btn btn-secondary btn-sm">
            Configure Site
          </Link>
        </div>
      </div>
    </div>
  );
}
