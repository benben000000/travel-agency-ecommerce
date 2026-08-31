'use client';
import { useState, useEffect } from 'react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  async function fetchUsers() {
    setLoading(true);
    try {
      const url = roleFilter ? `/api/users?role=${roleFilter}` : '/api/users';
      const res = await fetch(url);
      const data = await res.json();
      if (data.users) setUsers(data.users);
    } catch (err) {}
    setLoading(false);
  }

  async function toggleStatus(user) {
    const nextStatus = user.is_active ? 0 : 1;
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: nextStatus }),
      });
      const data = await res.json();
      if (!data.error) fetchUsers();
    } catch (err) {}
  }

  return (
    <div>
      <div className="dashboard-header">
        <div>
          <h1>Users & Travelers</h1>
          <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
            Manage platform members, registered travelers, and account permissions.
          </p>
        </div>
      </div>

      <div className="filters-bar" style={{ marginBottom: '20px' }}>
        <button
          className={`btn btn-sm ${roleFilter === '' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setRoleFilter('')}
        >
          All Roles
        </button>
        <button
          className={`btn btn-sm ${roleFilter === 'user' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setRoleFilter('user')}
        >
          Travelers (Users)
        </button>
        <button
          className={`btn btn-sm ${roleFilter === 'agent' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setRoleFilter('agent')}
        >
          Agents
        </button>
        <button
          className={`btn btn-sm ${roleFilter === 'admin' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setRoleFilter('admin')}
        >
          Admins
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="loading-spinner"></div>
        </div>
      ) : users.length === 0 ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <h3>No Users Found</h3>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            No accounts match the selected role.
          </p>
        </div>
      ) : (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div className="table-container" style={{ margin: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>User Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Phone</th>
                  <th>Bookings</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ fontWeight: '600' }}>{u.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>
                        Registered {new Date(u.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td>{u.email}</td>
                    <td>
                      <span
                        style={{
                          textTransform: 'uppercase',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          letterSpacing: '0.5px',
                          color: u.role === 'admin' ? 'var(--color-danger)' : u.role === 'agent' ? 'var(--color-accent)' : 'inherit',
                        }}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td>{u.phone || 'None'}</td>
                    <td>{u.booking_count || 0}</td>
                    <td>
                      <span className={u.is_active ? 'status-label status-active' : 'status-label status-cancelled'}>
                        {u.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td>
                      {u.role !== 'admin' && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => toggleStatus(u)}
                        >
                          {u.is_active ? 'Disable' : 'Enable'}
                        </button>
                      )}
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
