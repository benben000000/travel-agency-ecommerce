'use client';
import { useState, useEffect } from 'react';

export default function AgentPromoCodesPage() {
  const [promoCodes, setPromoCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: 10,
    min_order_amount: 0,
    max_uses: 0,
    valid_from: '',
    valid_to: '',
  });

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  async function fetchPromoCodes() {
    try {
      const res = await fetch('/api/promo-codes');
      const data = await res.json();
      if (data.promoCodes) setPromoCodes(data.promoCodes);
    } catch (err) {}
    setLoading(false);
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        discount_type: form.discount_type,
        discount_value:
          form.discount_type === 'percentage'
            ? parseInt(form.discount_value)
            : Math.round(parseFloat(form.discount_value) * 100),
        min_order_amount: Math.round((parseFloat(form.min_order_amount) || 0) * 100),
        max_uses: parseInt(form.max_uses) || 0,
        valid_from: form.valid_from || null,
        valid_to: form.valid_to || null,
      };

      const res = await fetch('/api/promo-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setShowCreate(false);
        setForm({
          code: '',
          discount_type: 'percentage',
          discount_value: 10,
          min_order_amount: 0,
          max_uses: 0,
          valid_from: '',
          valid_to: '',
        });
        fetchPromoCodes();
      }
    } catch (err) {
      setError('Failed to create promo code.');
    }
    setSubmitting(false);
  }

  async function toggleActive(code) {
    try {
      const res = await fetch(`/api/promo-codes/${code.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: code.active ? 0 : 1 }),
      });
      const data = await res.json();
      if (!data.error) fetchPromoCodes();
    } catch (err) {}
  }

  async function handleDelete(codeId) {
    if (!confirm('Are you sure you want to delete this promo code?')) return;
    try {
      const res = await fetch(`/api/promo-codes/${codeId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!data.error) fetchPromoCodes();
    } catch (err) {}
  }

  return (
    <div>
      <div className="dashboard-header">
        <div>
          <h1>Discount Promo Codes</h1>
          <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
            Create promotional discount codes for your travel packages.
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
          + Create Promo Code
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="loading-spinner"></div>
        </div>
      ) : promoCodes.length === 0 ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <h3>No Promo Codes Active</h3>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
            Offer exclusive discounts to travelers by generating custom coupon codes.
          </p>
          <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
            Create Promo Code
          </button>
        </div>
      ) : (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div className="table-container" style={{ margin: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Discount</th>
                  <th>Min Spend</th>
                  <th>Usage Limit</th>
                  <th>Used</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {promoCodes.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 'bold', letterSpacing: '1px' }}>
                      {c.code}
                    </td>
                    <td>
                      {c.discount_type === 'percentage'
                        ? `${c.discount_value}% OFF`
                        : `$${(c.discount_value / 100).toFixed(2)} OFF`}
                    </td>
                    <td>
                      {c.min_order_amount > 0 ? `$${(c.min_order_amount / 100).toFixed(2)}` : 'None'}
                    </td>
                    <td>{c.max_uses > 0 ? `${c.max_uses} uses` : 'Unlimited'}</td>
                    <td>{c.used_count || 0}</td>
                    <td>
                      <span className={c.active ? 'status-label status-active' : 'status-label status-cancelled'}>
                        {c.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => toggleActive(c)}
                        >
                          {c.active ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm"
                          style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                          onClick={() => handleDelete(c.id)}
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

      {/* Create Modal */}
      {showCreate && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Create New Promo Code</h3>
              <button className="modal-close" onClick={() => setShowCreate(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                {error && (
                  <div style={{ padding: '10px 14px', background: '#f8d7da', color: '#721c24', marginBottom: '16px', fontSize: '0.85rem' }}>
                    {error}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Coupon Code *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. SUMMER2026"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Discount Type</label>
                    <select
                      className="form-select"
                      value={form.discount_type}
                      onChange={(e) => setForm({ ...form, discount_type: e.target.value })}
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount ($)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Discount Value *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      className="form-input"
                      value={form.discount_value}
                      onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Min Order Spend ($ USD)</label>
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      value={form.min_order_amount}
                      onChange={(e) => setForm({ ...form, min_order_amount: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Max Uses (0 = unlimited)</label>
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      value={form.max_uses}
                      onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Valid From</label>
                    <input
                      type="date"
                      className="form-input"
                      value={form.valid_from}
                      onChange={(e) => setForm({ ...form, valid_from: e.target.value })}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Valid To</label>
                    <input
                      type="date"
                      className="form-input"
                      value={form.valid_to}
                      onChange={(e) => setForm({ ...form, valid_to: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowCreate(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Promo Code'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
