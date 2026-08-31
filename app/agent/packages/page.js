'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function AgentPackagesPage() {
  const { data: session } = useSession();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
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

  return (
    <div>
      <div className="dashboard-header">
        <div>
          <h1>My Travel Listings</h1>
          <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
            Create and maintain your published tour packages and travel experiences.
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
          All
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
          Pending
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
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <h3>No Listings Found</h3>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
            {statusFilter
              ? `No travel listings match status '${statusFilter}'.`
              : "You haven't published any travel packages yet."}
          </p>
          <Link href="/agent/packages/new" className="btn btn-primary btn-sm">
            Create Your First Listing
          </Link>
        </div>
      ) : (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div className="table-container" style={{ margin: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Destination</th>
                  <th>Duration</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {packages.map((pkg) => (
                  <tr key={pkg.id}>
                    <td>
                      <div style={{ fontWeight: '600' }}>
                        <Link href={`/packages/${pkg.slug}`}>{pkg.title}</Link>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                        Category: {pkg.category || 'General'}
                      </div>
                    </td>
                    <td>{pkg.destination || 'Global'}</td>
                    <td>
                      {pkg.duration_days} Day(s) {pkg.duration_nights ? `/ ${pkg.duration_nights} Night(s)` : ''}
                    </td>
                    <td style={{ fontWeight: '600' }}>
                      ${(pkg.price_amount / 100).toFixed(2)} {pkg.price_currency}
                    </td>
                    <td>
                      <span className={getStatusClass(pkg.status)}>{pkg.status}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <Link href={`/agent/packages/${pkg.id}/edit`} className="btn btn-secondary btn-sm">
                          Edit
                        </Link>
                        <button
                          type="button"
                          className="btn btn-sm"
                          style={{
                            borderColor: 'var(--color-border)',
                            color: pkg.status === 'active' ? 'var(--color-text-secondary)' : 'var(--color-primary)',
                          }}
                          onClick={() => toggleStatus(pkg)}
                        >
                          {pkg.status === 'active' ? 'Archive' : 'Activate'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm"
                          style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                          onClick={() => handleDelete(pkg.id)}
                          disabled={deletingId === pkg.id}
                        >
                          {deletingId === pkg.id ? '...' : 'Delete'}
                        </button>
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
