'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgents();
  }, []);

  async function fetchAgents() {
    setLoading(true);
    try {
      const res = await fetch('/api/users?role=agent');
      const data = await res.json();
      if (data.users) setAgents(data.users);
    } catch (err) {}
    setLoading(false);
  }

  async function toggleStatus(agent) {
    const nextStatus = agent.is_active ? 0 : 1;
    try {
      const res = await fetch(`/api/users/${agent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: nextStatus }),
      });
      const data = await res.json();
      if (!data.error) fetchAgents();
    } catch (err) {}
  }

  return (
    <div>
      <div className="dashboard-header">
        <div>
          <h1>Agents & Tour Operators</h1>
          <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
            Manage approved vendor accounts and create new tour operator credentials.
          </p>
        </div>
        <Link href="/admin/agents/new" className="btn btn-primary btn-sm">
          + Create New Agent
        </Link>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="loading-spinner"></div>
        </div>
      ) : agents.length === 0 ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <h3>No Agent Accounts Yet</h3>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
            Get started by creating your first tour operator account.
          </p>
          <Link href="/admin/agents/new" className="btn btn-primary btn-sm">
            Create Agent Account
          </Link>
        </div>
      ) : (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div className="table-container" style={{ margin: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Agent Name</th>
                  <th>Company / Agency</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Listings</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <div style={{ fontWeight: '600' }}>{a.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>
                        Joined {new Date(a.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td>{a.company_name || 'Individual Operator'}</td>
                    <td>{a.email}</td>
                    <td>{a.phone || 'None'}</td>
                    <td>
                      <Link href={`/admin/packages?agent_id=${a.id}`} style={{ fontWeight: '600' }}>
                        {a.package_count || 0} packages
                      </Link>
                    </td>
                    <td>
                      <span className={a.is_active ? 'status-label status-active' : 'status-label status-cancelled'}>
                        {a.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => toggleStatus(a)}
                        >
                          {a.is_active ? 'Deactivate' : 'Activate'}
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
    </div>
  );
}
