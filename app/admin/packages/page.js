'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function AdminPackagesContent() {
  const searchParams = useSearchParams();
  const agentId = searchParams.get('agent_id');

  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchPackages();
  }, [statusFilter, agentId]);

  async function fetchPackages() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (agentId) params.set('agent_id', agentId);
      params.set('limit', '100');

      const res = await fetch(`/api/packages?${params.toString()}`);
      const data = await res.json();
      if (data.packages) setPackages(data.packages);
    } catch (err) {}
    setLoading(false);
  }

  async function updateStatus(pkgId, newStatus) {
    try {
      const res = await fetch(`/api/packages/${pkgId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!data.error) fetchPackages();
    } catch (err) {}
  }

  async function toggleFeatured(pkg) {
    try {
      const res = await fetch(`/api/packages/${pkg.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: pkg.featured ? 0 : 1 }),
      });
      const data = await res.json();
      if (!data.error) fetchPackages();
    } catch (err) {}
  }

  async function handleDelete(pkgId) {
    if (!confirm('Are you sure you want to delete this travel package from the platform?')) return;
    try {
      const res = await fetch(`/api/packages/${pkgId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!data.error) fetchPackages();
    } catch (err) {}
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
          <h1>All Travel Listings</h1>
          <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
            Review, feature, moderate, and manage packages published by all operators.
          </p>
        </div>
        <Link href="/agent/packages/new" className="btn btn-primary btn-sm">
          + Add Listing
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
          <h3>No Packages Found</h3>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            {statusFilter
              ? `No packages match status '${statusFilter}'.`
              : 'No packages have been published on the platform yet.'}
          </p>
        </div>
      ) : (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div className="table-container" style={{ margin: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title & Slug</th>
                  <th>Tour Agent</th>
                  <th>Destination</th>
                  <th>Price</th>
                  <th>Featured</th>
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
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>
                        /{pkg.slug}
                      </div>
                    </td>
                    <td>
                      <div>{pkg.agent_name || 'Agent #' + pkg.agent_id}</div>
                      {pkg.agent_company && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                          {pkg.agent_company}
                        </div>
                      )}
                    </td>
                    <td>{pkg.destination || 'Global'}</td>
                    <td style={{ fontWeight: '600' }}>
                      ${(pkg.price_amount / 100).toFixed(2)} {pkg.price_currency}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-sm"
                        style={{
                          background: pkg.featured ? 'var(--color-primary)' : 'transparent',
                          color: pkg.featured ? '#ffffff' : 'var(--color-text-secondary)',
                          borderColor: 'var(--color-border)',
                        }}
                        onClick={() => toggleFeatured(pkg)}
                      >
                        {pkg.featured ? 'Featured' : 'Standard'}
                      </button>
                    </td>
                    <td>
                      <span className={getStatusClass(pkg.status)}>{pkg.status}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {pkg.status === 'pending' && (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => updateStatus(pkg.id, 'active')}
                          >
                            Approve
                          </button>
                        )}
                        {pkg.status === 'active' ? (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => updateStatus(pkg.id, 'archived')}
                          >
                            Archive
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => updateStatus(pkg.id, 'active')}
                          >
                            Activate
                          </button>
                        )}
                        <Link href={`/agent/packages/${pkg.id}/edit`} className="btn btn-secondary btn-sm">
                          Edit
                        </Link>
                        <button
                          type="button"
                          className="btn btn-sm"
                          style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
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
        </div>
      )}
    </div>
  );
}

export default function AdminPackagesPage() {
  return (
    <Suspense fallback={<div className="loading-page"><div className="loading-spinner"></div></div>}>
      <AdminPackagesContent />
    </Suspense>
  );
}
