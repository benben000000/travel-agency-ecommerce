'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreateAgentAccountPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    company_name: '',
    phone: '',
    bio: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          role: 'agent',
        }),
      });

      const data = await res.json();
      if (data.error) {
        setError(data.error);
        setLoading(false);
      } else {
        router.push('/admin/agents');
      }
    } catch (err) {
      setError('An error occurred while creating the agent account.');
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: '640px' }}>
      <div className="dashboard-header">
        <div>
          <Link href="/admin/agents" style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
            &larr; Back to Agents
          </Link>
          <h1 style={{ marginTop: '8px' }}>Create Tour Operator Account</h1>
        </div>
      </div>

      <div className="card" style={{ padding: '32px' }}>
        {error && (
          <div style={{ padding: '12px 16px', background: '#f8d7da', color: '#721c24', borderRadius: 'var(--radius)', marginBottom: '20px', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Contact Person / Agent Name *</label>
            <input
              type="text"
              required
              className="form-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Marco Silva"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Company / Agency Name</label>
            <input
              type="text"
              className="form-input"
              value={form.company_name}
              onChange={(e) => setForm({ ...form, company_name: e.target.value })}
              placeholder="e.g. Mediterranean Horizons Travel"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Login Email *</label>
              <input
                type="email"
                required
                className="form-input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="agent@company.com"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password *</label>
              <input
                type="password"
                required
                className="form-input"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Min 6 characters"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Direct Phone Number</label>
            <input
              type="tel"
              className="form-input"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+1 (555) 234-5678"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Agency Bio / Experience</label>
            <textarea
              rows={3}
              className="form-textarea"
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="Summary of tour operator specialties and credentials..."
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <Link href="/admin/agents" className="btn btn-secondary">
              Cancel
            </Link>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating Agent...' : 'Create Agent Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
