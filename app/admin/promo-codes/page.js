'use client';
import { useState, useEffect } from 'react';

export default function AdminPromoCodesPage() {
  const [promoCodes, setPromoCodes] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div>
      <div className="dashboard-header">
        <div>
          <h1>Platform Promo Codes</h1>
          <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
            Overview of promotional discount codes created by tour operators.
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="loading-spinner"></div>
        </div>
      ) : promoCodes.length === 0 ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <h3>No Promo Codes Active</h3>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            No tour operators have created promotional coupons yet.
          </p>
        </div>
      ) : (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div className="table-container" style={{ margin: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Tour Agent</th>
                  <th>Discount</th>
                  <th>Min Spend</th>
                  <th>Usage</th>
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
                    <td>{c.agent_name || 'Agent #' + c.agent_id}</td>
                    <td>
                      {c.discount_type === 'percentage'
                        ? `${c.discount_value}% OFF`
                        : `$${(c.discount_value / 100).toFixed(2)} OFF`}
                    </td>
                    <td>
                      {c.min_order_amount > 0 ? `$${(c.min_order_amount / 100).toFixed(2)}` : 'None'}
                    </td>
                    <td>{c.used_count || 0} / {c.max_uses > 0 ? c.max_uses : 'Unlimited'}</td>
                    <td>
                      <span className={c.active ? 'status-label status-active' : 'status-label status-cancelled'}>
                        {c.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => toggleActive(c)}
                      >
                        {c.active ? 'Disable' : 'Enable'}
                      </button>
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
