'use client';
import { useState, useEffect } from 'react';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    site_name: '',
    site_tagline: '',
    site_description: '',
    contact_email: '',
    contact_phone: '',
    contact_address: '',
    about_text: '',
    footer_text: '',
    smtp_host: '',
    smtp_port: '587',
    smtp_user: '',
    smtp_pass: '',
    smtp_from: '',
    default_currency: 'USD',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ success: '', error: '' });

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          setSettings((prev) => ({ ...prev, ...data.settings }));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setStatus({ success: '', error: '' });

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const data = await res.json();
      if (data.error) {
        setStatus({ success: '', error: data.error });
      } else {
        setStatus({ success: 'Platform settings saved successfully.', error: '' });
      }
    } catch (err) {
      setStatus({ success: '', error: 'Failed to update platform settings.' });
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px' }}>
      <div className="dashboard-header">
        <div>
          <h1>Site Settings & Configuration</h1>
          <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
            Manage platform branding, public contact info, and SMTP email server settings.
          </p>
        </div>
      </div>

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

      <form onSubmit={handleSave}>
        {/* Brand & Identity */}
        <div className="card" style={{ padding: '28px', marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '20px' }}>Brand & Identity</h3>

          <div className="form-group">
            <label className="form-label">Platform Name</label>
            <input
              type="text"
              required
              className="form-input"
              value={settings.site_name}
              onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Tagline</label>
            <input
              type="text"
              className="form-input"
              value={settings.site_tagline}
              onChange={(e) => setSettings({ ...settings, site_tagline: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Meta Description</label>
            <textarea
              rows={2}
              className="form-textarea"
              value={settings.site_description}
              onChange={(e) => setSettings({ ...settings, site_description: e.target.value })}
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Default Currency</label>
            <select
              className="form-select"
              value={settings.default_currency}
              onChange={(e) => setSettings({ ...settings, default_currency: e.target.value })}
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="AUD">AUD (A$)</option>
            </select>
          </div>
        </div>

        {/* Contact Information & About */}
        <div className="card" style={{ padding: '28px', marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '20px' }}>Contact Details & About Page</h3>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Public Contact Email</label>
              <input
                type="email"
                className="form-input"
                value={settings.contact_email}
                onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Public Support Phone</label>
              <input
                type="tel"
                className="form-input"
                value={settings.contact_phone}
                onChange={(e) => setSettings({ ...settings, contact_phone: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Office Address</label>
            <input
              type="text"
              className="form-input"
              value={settings.contact_address}
              onChange={(e) => setSettings({ ...settings, contact_address: e.target.value })}
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">About Us Narrative</label>
            <textarea
              rows={4}
              className="form-textarea"
              value={settings.about_text}
              onChange={(e) => setSettings({ ...settings, about_text: e.target.value })}
            />
          </div>
        </div>

        {/* Email & SMTP Integration */}
        <div className="card" style={{ padding: '28px', marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '8px' }}>Email & SMTP Delivery</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
            Configure your SMTP server to dispatch automated booking confirmations and agent notifications. Leave blank to run in console logging fallback mode.
          </p>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">SMTP Server Host</label>
              <input
                type="text"
                className="form-input"
                placeholder="smtp.gmail.com"
                value={settings.smtp_host}
                onChange={(e) => setSettings({ ...settings, smtp_host: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">SMTP Port</label>
              <input
                type="text"
                className="form-input"
                placeholder="587 or 465"
                value={settings.smtp_port}
                onChange={(e) => setSettings({ ...settings, smtp_port: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">SMTP Username / Email</label>
              <input
                type="text"
                className="form-input"
                value={settings.smtp_user}
                onChange={(e) => setSettings({ ...settings, smtp_user: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">SMTP Password / App Key</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••••••"
                value={settings.smtp_pass}
                onChange={(e) => setSettings({ ...settings, smtp_pass: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">From Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="noreply@global1onetravel.com"
              value={settings.smtp_from}
              onChange={(e) => setSettings({ ...settings, smtp_from: e.target.value })}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '40px' }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving Settings...' : 'Save All Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
