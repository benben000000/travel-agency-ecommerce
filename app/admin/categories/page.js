'use client';
import { useState, useEffect } from 'react';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: '',
    slug: '',
    type: 'destination',
    description: '',
    sort_order: 1,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (data.categories) setCategories(data.categories);
    } catch (err) {}
    setLoading(false);
  }

  function handleNameChange(val) {
    const slug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    setForm((f) => ({ ...f, name: val, slug }));
  }

  async function handleAdd(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          sort_order: parseInt(form.sort_order) || 0,
        }),
      });

      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setShowAdd(false);
        setForm({ name: '', slug: '', type: 'destination', description: '', sort_order: 1 });
        fetchCategories();
      }
    } catch (err) {
      setError('Failed to create category.');
    }
    setSubmitting(false);
  }

  const destinationCategories = categories.filter((c) => c.type === 'destination');
  const activityCategories = categories.filter((c) => c.type === 'activity');

  return (
    <div>
      <div className="dashboard-header">
        <div>
          <h1>Destinations & Categories</h1>
          <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
            Organize the marketplace browsing taxonomy with destination regions and activity genres.
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>
          + Add Category
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="loading-spinner"></div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
          {/* Destinations */}
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '16px' }}>Destination Regions</h3>
            <div className="table-container" style={{ margin: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Slug</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {destinationCategories.map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: '600' }}>{c.name}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{c.slug}</td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{c.description || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Activities */}
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '16px' }}>Activity Genres</h3>
            <div className="table-container" style={{ margin: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Slug</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {activityCategories.map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: '600' }}>{c.name}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{c.slug}</td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{c.description || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add New Category</h3>
              <button className="modal-close" onClick={() => setShowAdd(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="modal-body">
                {error && (
                  <div style={{ padding: '10px 14px', background: '#f8d7da', color: '#721c24', marginBottom: '16px', fontSize: '0.85rem' }}>
                    {error}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Category Type</label>
                  <select
                    className="form-select"
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                  >
                    <option value="destination">Destination Region</option>
                    <option value="activity">Activity Genre</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Category Name *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. Nordic Fjords or Scuba Diving"
                    value={form.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">URL Slug *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    rows={2}
                    className="form-textarea"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Brief description for category badges..."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Sort Order</label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    value={form.sort_order}
                    onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowAdd(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
                  {submitting ? 'Adding...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
