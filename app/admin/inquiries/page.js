'use client';
import { useState, useEffect } from 'react';

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInquiries();
  }, []);

  async function fetchInquiries() {
    try {
      const res = await fetch('/api/contact');
      const data = await res.json();
      if (data.submissions) setInquiries(data.submissions);
    } catch (err) {}
    setLoading(false);
  }

  return (
    <div>
      <div className="dashboard-header">
        <div>
          <h1>Contact Form Inquiries</h1>
          <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
            Review inquiries and messages submitted by prospective travelers through the contact page.
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="loading-spinner"></div>
        </div>
      ) : inquiries.length === 0 ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <h3>No Inquiries Yet</h3>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Messages received via the contact page will appear here.
          </p>
        </div>
      ) : (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div className="table-container" style={{ margin: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Sender</th>
                  <th>Subject</th>
                  <th>Message Preview</th>
                  <th>Received Date</th>
                </tr>
              </thead>
              <tbody>
                {inquiries.map((inq) => (
                  <tr key={inq.id}>
                    <td>
                      <div style={{ fontWeight: '600' }}>{inq.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                        <a href={`mailto:${inq.email}`}>{inq.email}</a>
                      </div>
                    </td>
                    <td style={{ fontWeight: '600' }}>{inq.subject || 'General Inquiry'}</td>
                    <td style={{ maxWidth: '360px' }}>
                      <div style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>{inq.message}</div>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--color-text-light)' }}>
                      {new Date(inq.created_at).toLocaleString()}
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
