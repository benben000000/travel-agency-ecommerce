'use client';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';

export default function AdminDashboardLayout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (isLoginPage) return;

    if (status === 'unauthenticated') {
      router.push('/admin/login');
    } else if (status === 'authenticated') {
      if (session?.user?.role !== 'admin') {
        router.push('/admin/login');
      }
    }
  }, [status, session, router, pathname, isLoginPage]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (status === 'loading') {
    return (
      <div className="loading-page">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!session || session.user.role !== 'admin') {
    return null;
  }

  const navItems = [
    { label: 'Platform Overview', href: '/admin' },
    { label: 'Agents & Vendors', href: '/admin/agents' },
    { label: 'Users / Travelers', href: '/admin/users' },
    { label: 'All Travel Listings', href: '/admin/packages' },
    { label: 'All Bookings', href: '/admin/bookings' },
    { label: 'Categories', href: '/admin/categories' },
    { label: 'Promo Codes', href: '/admin/promo-codes' },
    { label: 'Contact Inquiries', href: '/admin/inquiries' },
    { label: 'Site Settings', href: '/admin/settings' },
  ];

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <div style={{ padding: '0 24px 20px', borderBottom: '1px solid var(--color-border)', marginBottom: '16px' }}>
          <Link href="/" style={{ display: 'block', marginBottom: '14px' }}>
            <img src="/images/global1-logo.png" alt="Global 1" style={{ height: '32px', width: 'auto' }} />
          </Link>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-danger)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>
            Super Admin Control
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
            {session.user.name}
          </div>
          <div style={{ marginTop: '12px' }}>
            <ThemeToggle />
          </div>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-title">Administration</div>
          <nav className="sidebar-nav">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} className={isActive ? 'active' : ''}>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="sidebar-section" style={{ marginTop: 'auto', paddingTop: '20px' }}>
          <div className="sidebar-section-title">Navigation</div>
          <nav className="sidebar-nav">
            <Link href="/agent">Agent Portal</Link>
            <Link href="/packages">Marketplace</Link>
            <button
              onClick={() => signOut({ callbackUrl: '/admin/login' })}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '10px 24px',
                background: 'none',
                border: 'none',
                borderLeft: '3px solid transparent',
                color: 'var(--color-danger)',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Sign Out
            </button>
          </nav>
        </div>
      </aside>

      <main className="dashboard-main">{children}</main>
    </div>
  );
}
