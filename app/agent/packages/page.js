'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

const PAGE_SIZE = 10;

export default function AgentPackagesPage() {
  const { data: session } = useSession();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
    fetchPackages();
  }, [session, statusFilter]);

  async function fetchPackages() {
    if (!session?.user?.id) return;
    setLoading(true);
    try {
      const url = statusFilter
        ? `/api/packages?agent_id=${session.user.id}&status=${statusFilter}&limit=100`
        : `/api/packages?agent_id=${session.user.id}&limit=100`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.packages) setPackages(data.packages);
    } catch (err) {}
    setLoading(false);
  }

  async function toggleStatus(pkg) {
    const nextStatus = pkg.status === 'active' ? 'archived' : 'active';
    try {
      const res = await fetch(`/api/packages/${pkg.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!data.error) fetchPackages();
    } catch (err) {}
  }

  async function handleDelete(pkgId) {
    if (!confirm('Are you sure you want to delete this travel package listing?')) return;
    setDeletingId(pkgId);
    try {
      const res = await fetch(`/api/packages/${pkgId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!data.error) fetchPackages();
    } catch (err) {}
    setDeletingId(null);
  }

  function getStatusClass(status) {
    switch (status) {
      case 'active': return 'status-label status-active';
      case 'pending': return 'status-label status-pending';
      case 'archived': return 'status-label status-cancelled';
      case 'rejected': return 'status-label status-rejected';
      default: return 'status-label';
    }
  }

  const visiblePackages = packages.slice(0, visibleCount);
  const hasMore = visibleCount < packages.length;

  return (
    <div>
      <div className="dashboard-header">
        <div>
          <h1>My Travel Listings</h1>
          <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
            Manage and publish tour packages, day-by-day itineraries, and pricing.
          </p>
        </div>
        <Link href="/agent/packages/new" className="btn btn-primary btn-sm">
          + Create New Listing
        </Link>
      </div>

      <div className="filters-bar" style={{ marginBottom: '20px' }}>
        <button
          className={`btn btn-sm ${statusFilter === '' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setStatusFilter('')}
        >
          All Listings ({packages.length})
        </button>
        <button
          className={`btn btn-sm ${statusFilter === 'active' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setStatusFilter('active')}
        >
          Active
        </button>
        <button
          className={`btn btn-sm ${statusFilter === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setStatusFilter('pending')}
        >
          Pending Review
        </button>
        <button
          className={`btn btn-sm ${statusFilter === 'archived' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setStatusFilter('archived')}
        >
          Archived
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="loading-spinner"></div>
        </div>
      ) : packages.length === 0 ? (
        <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
          <h3>No Listings Created Yet</h3>
          <p style={{ color: 'var(--color-text-secondary)', margin: '12px 0 24px' }}>
            Publish your first travel itinerary bundle to receive direct traveler bookings.
          </p>
          <Link href="/agent/packages/new" className="btn btn-primary">
            Create First Package Listing
          </Link>
        </div>
      ) : (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div className="table-container" style={{ margin: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title & Destination</th>
                  <th>Duration</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Featured</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visiblePackages.map((pkg) => (
                  <tr key={pkg.id}>
                    <td>
                      <div style={{ fontWeight: '600' }}>
                        <Link href={`/packages/${pkg.slug}`}>{pkg.title}</Link>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                        {pkg.destination || 'Global'}
                      </div>
                    </td>
                    <td>{pkg.duration_days} Days / {pkg.duration_nights || (pkg.duration_days - 1)} Nights</td>
                    <td style={{ fontWeight: 'bold' }}>
                      ${(pkg.price_amount / 100).toFixed(2)}
                    </td>
                    <td>
                      <span className={getStatusClass(pkg.status)}>{pkg.status}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem', color: pkg.featured ? 'var(--color-primary)' : 'var(--color-text-light)', fontWeight: '600' }}>
                        {pkg.featured ? 'Featured' : 'Standard'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <Link href={`/agent/packages/${pkg.id}/edit`} className="btn btn-secondary btn-sm">
                          Edit
                        </Link>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => toggleStatus(pkg)}
                        >
                          {pkg.status === 'active' ? 'Archive' : 'Publish'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm"
                          style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                          disabled={deletingId === pkg.id}
                          onClick={() => handleDelete(pkg.id)}
                        >
                          Delete
                        </button>
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
                Load More Listings ({visiblePackages.length} of {packages.length})
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
