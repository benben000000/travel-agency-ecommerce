'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AboutPage() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          setSettings(data.settings);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="page-content">
      <div className="container" style={{ maxWidth: '800px' }}>
        <h1 style={{ marginBottom: '16px' }}>About {settings.site_name || 'Global One Travel'}</h1>
        <p style={{ color: 'var(--color-accent)', fontSize: '1.2rem', marginBottom: '32px' }}>
          {settings.site_tagline || 'Your Gateway to Extraordinary Journeys'}
        </p>

        <div className="card" style={{ padding: '32px', marginBottom: '32px' }}>
          <h3 style={{ marginBottom: '16px' }}>Our Mission</h3>
          <p style={{ fontSize: '1.05rem', lineHeight: '1.8', color: 'var(--color-text)' }}>
            {settings.about_text ||
              'Global One Travel is a trusted marketplace connecting travelers with verified tour operators and travel agents worldwide. We curate exceptional travel experiences, ensuring quality, transparency, and unforgettable memories for every journey.'}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '40px' }}>
          <div className="card" style={{ padding: '24px' }}>
            <h4 style={{ marginBottom: '8px' }}>Verified Operators</h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', margin: 0 }}>
              Every travel agent and tour vendor is vetted by platform administrators for service excellence and dependability.
            </p>
          </div>
          <div className="card" style={{ padding: '24px' }}>
            <h4 style={{ marginBottom: '8px' }}>Direct Communication</h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', margin: 0 }}>
              Engage directly with tour managers through our built-in real-time messaging system.
            </p>
          </div>
          <div className="card" style={{ padding: '24px' }}>
            <h4 style={{ marginBottom: '8px' }}>Transparent Policies</h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', margin: 0 }}>
              Clear pricing, upfront inclusions and exclusions, and fair cancellation policies on all listings.
            </p>
          </div>
        </div>

        <div style={{ textAlign: 'center', paddingTop: '16px' }}>
          <Link href="/packages" className="btn btn-primary" style={{ marginRight: '16px' }}>
            Browse Packages
          </Link>
          <Link href="/contact" className="btn btn-secondary">
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
}
