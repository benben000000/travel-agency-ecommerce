'use client';
import { useState } from 'react';
import { signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: form.email,
        password: form.password,
      });

      if (result?.error) {
        setError('Invalid administrative credentials');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/auth/session');
      const session = await res.json();

      if (session?.user?.role === 'admin') {
        router.push('/admin');
      } else {
        await signOut({ redirect: false });
        setError('Access Denied: Administrative privileges required.');
      }
    } catch (err) {
      setError('An error occurred during authentication.');
    }
    setLoading(false);
  }

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ borderTop: '3px solid var(--color-danger)' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <img
            src="/images/global1-logo.png"
            alt="Global 1"
            style={{ height: '36px', width: 'auto', margin: '0 auto 10px' }}
          />
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '0.8rem', color: 'var(--color-danger)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            SUPER ADMIN GATEWAY
          </div>
        </div>

        <h1>Platform Administration</h1>
        <p className="auth-subtitle">Restricted administrative access for platform supervisors.</p>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Admin Identity / Email</label>
            <input
              type="email"
              className="form-input"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="admin@global1onetravel.com"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Passkey</label>
            <input
              type="password"
              className="form-input"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
            {loading ? 'Verifying...' : 'Access Admin Console'}
          </button>
        </form>

        <p className="auth-footer">
          <Link href="/">Return to Public Homepage</Link>
        </p>
      </div>
    </div>
  );
}
