'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function AgentProfilePage() {
  const { data: session, update } = useSession();
  const [form, setForm] = useState({
    name: '',
    company_name: '',
    email: '',
    phone: '',
    bio: '',
    currentPassword: '',
    newPassword: '',
  });
  const [status, setStatus] = useState({ loading: false, success: '', error: '' });

  useEffect(() => {
    if (session?.user?.id) {
      fetch(`/api/users/${session.user.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.user) {
            setForm((f) => ({
              ...f,
              name: data.user.name || '',
              company_name: data.user.company_name || '',
              email: data.user.email || '',
              phone: data.user.phone || '',
              bio: data.user.bio || '',
            }));
          }
        })
        .catch(() => {});
    }
  }, [session]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!session?.user?.id) return;
    setStatus({ loading: true, success: '', error: '' });

    try {
      const res = await fetch(`/api/users/${session.user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          company_name: form.company_name,
          phone: form.phone,
          bio: form.bio,
          currentPassword: form.currentPassword || undefined,
          newPassword: form.newPassword || undefined,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setStatus({ loading: false, success: '', error: data.error });
      } else {
        setStatus({ loading: false, success: 'Company profile updated successfully.', error: '' });
        setForm((f) => ({ ...f, currentPassword: '', newPassword: '' }));
        if (update) update();
      }
    } catch (err) {
      setStatus({ loading: false, success: '', error: 'Failed to update company profile.' });
    }
  }

  return (
    <div style={{ maxWidth: '640px' }}>
      <div className="dashboard-header">
        <div>
          <h1>Operator Profile & Agency Details</h1>
          <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
            Update your business credentials, agency name, and public bio.
          </p>
        </div>
      </div>

      <div className="card" style={{ padding: '32px' }}>
        {status.success && (
          <div style={{ padding: '12px 16px', background: '#d4edda', color: '#155724', borderRadius: 'var(--radius)', marginBottom: '20px', fontSize: '0.9rem' }}>
            {status.success}
          </div>
        )}

        {status.error && (
          <div style={{ padding: '12px 16px', background: '#f8d7da', color: '#721c24', borderRadius: 'var(--radius)', marginBottom: '20px', fontSize: '0.9rem' }}>
            {status.error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Contact Person Name *</label>
            <input
              type="text"
              required
              className="form-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Company / Tour Agency Name</label>
            <input
              type="text"
              className="form-input"
              value={form.company_name}
              onChange={(e) => setForm({ ...form, company_name: e.target.value })}
              placeholder="e.g. Pacific Horizons Expeditions"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Login Email (Read-only)</label>
            <input
              type="email"
              disabled
              className="form-input"
              value={form.email}
              style={{ background: 'var(--color-bg-alt)', cursor: 'not-allowed' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Agency Phone Number</label>
            <input
              type="tel"
              className="form-input"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+1 (800) 555-0199"
            />
          </div>

          <div className="form-group">
            <label className="form-label">About the Agency (Bio)</label>
            <textarea
              rows={3}
              className="form-textarea"
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="Describe your tour specialties, years of experience, and destination knowledge..."
            />
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '24px 0' }} />

          <h4 style={{ marginBottom: '16px' }}>Change Password (Optional)</h4>

          <div className="form-group">
            <label className="form-label">Current Password</label>
            <input
              type="password"
              className="form-input"
              value={form.currentPassword}
              onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
              placeholder="Leave blank to keep unchanged"
            />
          </div>

          <div className="form-group">
            <label className="form-label">New Password</label>
            <input
              type="password"
              className="form-input"
              value={form.newPassword}
              onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
              placeholder="Enter new password"
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={status.loading}>
            {status.loading ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}
