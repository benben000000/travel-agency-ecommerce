'use client';
import { useState, useEffect } from 'react';

export default function ContactPage() {
  const [settings, setSettings] = useState({});
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState({ loading: false, success: false, error: '' });

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) setSettings(data.settings);
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus({ loading: true, success: false, error: '' });
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.error) {
        setStatus({ loading: false, success: false, error: data.error });
      } else {
        setStatus({ loading: false, success: true, error: '' });
        setForm({ name: '', email: '', subject: '', message: '' });
      }
    } catch (err) {
      setStatus({ loading: false, success: false, error: 'Failed to send message. Please try again.' });
    }
  }

  return (
    <div className="page-content">
      <div className="container" style={{ maxWidth: '900px' }}>
        <h1 style={{ marginBottom: '8px' }}>Contact Us</h1>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '32px' }}>
          Have questions or need assistance with your travel plans? Our support team is here to help.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px' }}>
          <div className="card" style={{ padding: '32px' }}>
            <h3 style={{ marginBottom: '20px' }}>Get in Touch</h3>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontWeight: '600', fontSize: '0.85rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
                Email
              </div>
              <div style={{ fontSize: '1rem', color: 'var(--color-text)' }}>
                {settings.contact_email || 'info@global1onetravel.com'}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontWeight: '600', fontSize: '0.85rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
                Phone
              </div>
              <div style={{ fontSize: '1rem', color: 'var(--color-text)' }}>
                {settings.contact_phone || '+1 (800) 123-4567'}
              </div>
            </div>

            <div>
              <div style={{ fontWeight: '600', fontSize: '0.85rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
                Address
              </div>
              <div style={{ fontSize: '1rem', color: 'var(--color-text)' }}>
                {settings.contact_address || '123 Travel Street, Suite 100, New York, NY 10001'}
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '32px' }}>
            <h3 style={{ marginBottom: '20px' }}>Send a Message</h3>

            {status.success && (
              <div style={{ padding: '12px 16px', background: '#d4edda', color: '#155724', borderRadius: 'var(--radius)', marginBottom: '20px', fontSize: '0.9rem' }}>
                Thank you for your message. We will get back to you shortly.
              </div>
            )}

            {status.error && (
              <div style={{ padding: '12px 16px', background: '#f8d7da', color: '#721c24', borderRadius: 'var(--radius)', marginBottom: '20px', fontSize: '0.9rem' }}>
                {status.error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Your Name</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Your Email</label>
                <input
                  type="email"
                  required
                  className="form-input"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Subject</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Message</label>
                <textarea
                  required
                  rows={4}
                  className="form-textarea"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                />
              </div>

              <button type="submit" className="btn btn-primary btn-block" disabled={status.loading}>
                {status.loading ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
