'use client';
import { useState, useEffect } from 'react';

const PAGE_SIZE = 15;

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
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

  const visibleUsers = users.slice(0, visibleCount);
  const hasMore = visibleCount < users.length;

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
          All Roles ({users.length})
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
            No user accounts match the selected filter.
          </p>
        </div>
      ) : (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div className="table-container" style={{ margin: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>User / Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Phone / Info</th>
                  <th>Status</th>
                  <th>Joined Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleUsers.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ fontWeight: '600' }}>{u.name}</div>
                      {u.company_name && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                          {u.company_name}
                        </div>
                      )}
                    </td>
                    <td>{u.email}</td>
                    <td>
                      <span
                        className="status-label"
                        style={{
                          color: u.role === 'admin' ? 'var(--color-danger)' : u.role === 'agent' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                          borderColor: 'currentColor',
                        }}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <div>{u.phone || '—'}</div>
                    </td>
                    <td>
                      <span className={u.is_active ? 'status-label status-confirmed' : 'status-label status-cancelled'}>
                        {u.is_active ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--color-text-light)' }}>
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      {u.role !== 'admin' && (
                        <button
                          type="button"
                          className="btn btn-sm"
                          style={{
                            color: u.is_active ? 'var(--color-danger)' : 'var(--color-success)',
                            borderColor: 'currentColor',
                          }}
                          onClick={() => toggleStatus(u)}
                        >
                          {u.is_active ? 'Suspend' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {hasMore && (
            <div style={{ textAlign: 'center', padding: '20px', borderTop: '1px solid var(--color-border)', background: 'var(--color-bg-card)' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
              >
                Load More Users ({visibleUsers.length} of {users.length})
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
